/** @jsx jsx */
import { useEffect, useRef } from "react";
import { Box, jsx } from "theme-ui";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  setGeoLevelVisibility,
  SelectionTool,
  replaceSelectedGeounits,
  FindTool
} from "../../actions/districtDrawing";
import { getDistrictColor } from "../../constants/colors";
import {
  UintArrays,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts
} from "../../../shared/entities";
import { DistrictsGeoJSON } from "../../types";
import { areAnyGeoUnitsSelected, getSelectedGeoLevel } from "../../functions";
import {
  GEOLEVELS_SOURCE_ID,
  DISTRICTS_SOURCE_ID,
  featureStateDistricts,
  generateMapLayers,
  getGeoLevelVisibility,
  levelToLabelLayerId,
  levelToLineLayerId,
  onlyUnlockedGeoUnits,
  getChildGeoUnits,
  DISTRICTS_OUTLINE_LAYER_ID,
  setFeaturesSelectedFromGeoUnits
} from "./index";
import DefaultSelectionTool from "./DefaultSelectionTool";
import FindMenu from "./FindMenu";
import MapMessage from "./MapMessage";
import MapTooltip from "./MapTooltip";
import RectangleSelectionTool from "./RectangleSelectionTool";
import store from "../../store";
import { State } from "../../reducers";
import { connect } from "react-redux";

interface Props {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: UintArrays;
  readonly selectedGeounits: GeoUnits;
  readonly selectedDistrictId: number;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly lockedDistricts: LockedDistricts;
  readonly isReadOnly: boolean;
  readonly findMenuOpen: boolean;
  readonly findTool: FindTool;
  readonly label?: string;
  readonly map?: MapboxGL.Map;
  // eslint-disable-next-line
  readonly setMap: (map: MapboxGL.Map) => void;
}

const DistrictsMap = ({
  project,
  geojson,
  staticMetadata,
  staticGeoLevels,
  selectedGeounits,
  selectedDistrictId,
  selectionTool,
  geoLevelIndex,
  lockedDistricts,
  isReadOnly,
  findMenuOpen,
  findTool,
  label,
  map,
  setMap
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);

  // Conversion from readonly -> mutable to match Mapbox interface
  const [b0, b1, b2, b3] = staticMetadata.bbox;

  const selectedGeolevel = getSelectedGeoLevel(staticMetadata.geoLevelHierarchy, geoLevelIndex);

  const minZoom = Math.min(...staticMetadata.geoLevelHierarchy.map(geoLevel => geoLevel.minZoom));
  const maxZoom = Math.max(...staticMetadata.geoLevelHierarchy.map(geoLevel => geoLevel.maxZoom));

  // While a geolevel has tiles up to the maxZoom level, we want the enable the user to zoom in
  // beyond that zoom level. Using lower zoom tiles at higher zoom levels is called overzoom.
  // The ability to zoom this far in isn't needed in the typical use-case (+4 is fine for that),
  // but it's needed in order to allow the user to fix very tiny unassigned slivers that may arise.
  const overZoom = maxZoom + 8;

  useEffect(() => {
    // eslint-disable-next-line
    if (mapRef.current === null) {
      return;
    }

    // eslint-disable-next-line
    MapboxGL.accessToken =
      "pk.eyJ1IjoiZGlzdHJpY3RidWlsZGVyIiwiYSI6ImNrZXZzeXlvMjIxb2QycW1yeGpuMDJ2ZGwifQ.FdOGNk3y1BPkGvF_yCjjGQ";

    const map = new MapboxGL.Map({
      container: mapRef.current,
      style: "mapbox://styles/districtbuilder/ckexc26lz0d3k19owrswhxz9o",
      bounds: [b0, b1, b2, b3],
      fitBoundsOptions: { padding: 20 },
      minZoom: minZoom,
      maxZoom: overZoom
    });

    map.addControl(
      new MapboxGL.NavigationControl({
        showCompass: false,
        showZoom: true
      }),
      "top-right"
    );

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.doubleClickZoom.disable();

    const setLevelVisibility = () =>
      store.dispatch(setGeoLevelVisibility(getGeoLevelVisibility(map, staticMetadata)));
    const onMapLoad = () => {
      generateMapLayers(
        project.regionConfig.s3URI,
        project.regionConfig.regionCode,
        staticMetadata.geoLevelHierarchy,
        minZoom,
        maxZoom,
        map,
        geojson
      );

      setMap(map);

      map.resize();
    };

    setLevelVisibility();
    map.on("load", onMapLoad);
    map.on("zoomend", setLevelVisibility);

    return () => {
      map.off("load", onMapLoad);
      map.off("zoomend", setLevelVisibility);
    };

    // Everything in this effect should only happen on component load
    // eslint-disable-next-line
  }, [mapRef]);

  // Update districts source when geojson is fetched or find type is changed
  useEffect(() => {
    // Add a color property to the geojson, so it can be used for styling
    geojson.features.forEach((feature, id) => {
      // @ts-ignore
      // eslint-disable-next-line
      feature.properties.outlineColor =
        (findTool === FindTool.Unassigned && id === 0) ||
        (findTool === FindTool.NonContiguous &&
          id !== 0 &&
          feature.geometry.coordinates.length >= 2)
          ? "#F25DFE"
          : "transparent";
      // @ts-ignore
      // eslint-disable-next-line
      feature.properties.color = getDistrictColor(id);
    });

    const districtsSource = map && map.getSource(DISTRICTS_SOURCE_ID);
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);
  }, [map, geojson, findTool]);

  const removeSelectedFeatures = (map: MapboxGL.Map, staticMetadata: IStaticMetadata) => {
    staticMetadata.geoLevelHierarchy
      .map(geoLevel => geoLevel.id)
      .forEach(sourceLayer =>
        map.removeFeatureState({
          source: GEOLEVELS_SOURCE_ID,
          sourceLayer
        })
      );
  };

  // Remove selected features from map when selected geounit ids has been emptied
  useEffect(() => {
    map &&
      !areAnyGeoUnitsSelected(selectedGeounits) &&
      (selectedDistrictId === 0
        ? removeSelectedFeatures(map, staticMetadata)
        : // When adding or changing the district to which a geounit is
        // assigned, wait until districts GeoJSON is updated before removing
        // selected state.
        map.isStyleLoaded() && map.isSourceLoaded(DISTRICTS_SOURCE_ID)
        ? removeSelectedFeatures(map, staticMetadata)
        : map.once("idle", () => removeSelectedFeatures(map, staticMetadata)));
    // We don't want to tigger this effect when `selectedDistrictId` changes
    // eslint-disable-next-line
  }, [map, selectedGeounits, staticMetadata]);

  // Update labels when selection is changed
  useEffect(() => {
    // eslint-disable-next-line
    if (map) {
      staticMetadata.geoLevelHierarchy.forEach(geoLevel =>
        map.setLayoutProperty(levelToLabelLayerId(geoLevel.id), "visibility", "none")
      );
      map.setLayoutProperty(levelToLabelLayerId(selectedGeolevel.id), "visibility", "visible");
      map.setLayoutProperty(
        levelToLabelLayerId(selectedGeolevel.id),
        "text-field",
        label ? `{${label}-abbrev}` : ""
      );
    }
  }, [map, label, staticMetadata, selectedGeolevel]);

  // Toggle unassigned highlight when find menu is opened
  useEffect(() => {
    map &&
      map.setLayoutProperty(
        DISTRICTS_OUTLINE_LAYER_ID,
        "visibility",
        findMenuOpen ? "visible" : "none"
      );
  }, [map, findMenuOpen]);

  useEffect(() => {
    map &&
      [...new Array(project.numberOfDistricts + 1).keys()].forEach(districtId =>
        map.setFeatureState(featureStateDistricts(districtId), {
          locked: lockedDistricts[districtId]
        })
      );
  }, [map, project, lockedDistricts]);

  // Update layer visibility when geolevel is selected
  useEffect(() => {
    // eslint-disable-next-line
    if (map && staticMetadata) {
      const invertedGeoLevelIndex = staticMetadata.geoLevelHierarchy.length - geoLevelIndex - 1;

      staticMetadata.geoLevelHierarchy.forEach((geoLevel, idx) =>
        map.setLayoutProperty(
          levelToLineLayerId(geoLevel.id),
          "visibility",
          idx >= invertedGeoLevelIndex ? "visible" : "none"
        )
      );
    }
  }, [map, staticMetadata, geoLevelIndex]);

  // Keep track of when selected geounits change
  const prevSelectedGeoUnitsRef = useRef<typeof selectedGeounits | undefined>();
  useEffect(() => {
    prevSelectedGeoUnitsRef.current = selectedGeounits; // eslint-disable-line
  });
  const prevSelectedGeoUnits = prevSelectedGeoUnitsRef.current;

  // Update map when selected geounits change.
  // Typically the geounits change as a result of using the selection tools directly -- map is
  // changed and then that needs to be reflected in state -- but this accounts for undo/redo actions
  // affecting state which then needs to be reflected in the map.
  useEffect(() => {
    // eslint-disable-next-line
    if (map) {
      prevSelectedGeoUnits && setFeaturesSelectedFromGeoUnits(map, prevSelectedGeoUnits, false);
      selectedGeounits && setFeaturesSelectedFromGeoUnits(map, selectedGeounits, true);
    }
  }, [map, selectedGeounits, prevSelectedGeoUnits]);

  // Keep track of when selected geolevel changes
  const prevGeoLevelIndexRef = useRef<typeof geoLevelIndex | undefined>();
  useEffect(() => {
    prevGeoLevelIndexRef.current = geoLevelIndex; // eslint-disable-line
  });
  const prevGeoLevelIndex = prevGeoLevelIndexRef.current;

  useEffect(() => {
    // Convert any larger geounits to the smaller sub-geounits as per the new geolevel
    const prevSelectedGeoLevel =
      prevGeoLevelIndex !== undefined
        ? getSelectedGeoLevel(staticMetadata.geoLevelHierarchy, prevGeoLevelIndex)
        : null;
    const selectedGeounitsForPrevLevel =
      prevSelectedGeoLevel && selectedGeounits[prevSelectedGeoLevel.id];
    // eslint-disable-next-line
    if (
      map &&
      prevGeoLevelIndex !== undefined &&
      geoLevelIndex > prevGeoLevelIndex &&
      prevSelectedGeoLevel &&
      selectedGeounitsForPrevLevel &&
      selectedGeounitsForPrevLevel.size > 0
    ) {
      [...selectedGeounitsForPrevLevel.entries()].forEach(selectedGeoUnit => {
        const [featureId, geoUnitIndices] = selectedGeoUnit;
        // eslint-disable-next-line
        if (geoUnitIndices.length === staticMetadata.geoLevelHierarchy.length) {
          // Don't do this for the smallest geounits since they have no sub-geounits
          return;
        }
        // eslint-disable-next-line
        if (geoUnitIndices.length - 1 === geoLevelIndex) {
          // Don't do anything for previously selected geounits at this level
          return;
        }

        // Deselect the currently selected feature
        map.removeFeatureState({
          id: featureId,
          source: GEOLEVELS_SOURCE_ID,
          sourceLayer: prevSelectedGeoLevel.id
        });

        // Select features of the child geolevel
        const { childGeoLevel, childGeoUnitIds, childGeoUnits } = getChildGeoUnits(
          geoUnitIndices,
          staticMetadata,
          staticGeoLevels
        );
        childGeoUnitIds.forEach(id => {
          map.setFeatureState(
            {
              source: GEOLEVELS_SOURCE_ID,
              id,
              sourceLayer: childGeoLevel.id
            },
            { selected: true }
          );
        });
        const unlockedChildGeoUnits = onlyUnlockedGeoUnits(
          project.districtsDefinition,
          lockedDistricts,
          childGeoUnits,
          staticMetadata,
          staticGeoLevels
        );
        // Update state
        store.dispatch(
          replaceSelectedGeounits({
            add: unlockedChildGeoUnits,
            remove: {
              [prevSelectedGeoLevel.id]: new Map([selectedGeoUnit])
            }
          })
        );
      });
    }
  }, [
    map,
    geoLevelIndex,
    prevGeoLevelIndex,
    selectedGeolevel,
    staticGeoLevels,
    staticMetadata,
    selectedGeounits,
    project,
    lockedDistricts
  ]);

  useEffect(() => {
    /* eslint-disable */
    if (map) {
      // Disable any existing selection tools
      DefaultSelectionTool.disable(map);
      RectangleSelectionTool.disable(map);
      // Enable appropriate tool
      if (!isReadOnly && selectionTool === SelectionTool.Default) {
        DefaultSelectionTool.enable(
          map,
          selectedGeolevel.id,
          staticMetadata,
          project.districtsDefinition,
          lockedDistricts,
          staticGeoLevels
        );
      } else if (!isReadOnly && selectionTool === SelectionTool.Rectangle) {
        RectangleSelectionTool.enable(
          map,
          selectedGeolevel.id,
          staticMetadata,
          project.districtsDefinition,
          lockedDistricts,
          staticGeoLevels
        );
      }
      /* eslint-enable */
    }
  }, [
    map,
    selectionTool,
    selectedGeolevel,
    staticMetadata,
    staticGeoLevels,
    project,
    lockedDistricts,
    isReadOnly
  ]);

  return (
    <Box ref={mapRef} sx={{ width: "100%", height: "100%", position: "relative" }}>
      <MapTooltip map={map || undefined} />
      <MapMessage map={map || undefined} maxZoom={maxZoom} />
      <FindMenu map={map} />
    </Box>
  );
};

function mapStateToProps(state: State) {
  return {
    findMenuOpen: state.project.findMenuOpen,
    findTool: state.project.findTool
  };
}

export default connect(mapStateToProps)(DistrictsMap);
