/** @jsx jsx */
import { useEffect, useRef, useState } from "react";
import { Box, jsx } from "theme-ui";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  editSelectedGeounits,
  setGeoLevelVisibility,
  SelectionTool
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
import { getAllIndices } from "../../../shared/functions";
import {
  GEOLEVELS_SOURCE_ID,
  DISTRICTS_SOURCE_ID,
  featureStateDistricts,
  generateMapLayers,
  getGeoLevelVisibility,
  levelToLabelLayerId,
  levelToLineLayerId,
  onlyUnlockedGeoUnits
} from "./index";
import AdvancedEditingModal from "./AdvancedEditingModal";
import DefaultSelectionTool from "./DefaultSelectionTool";
import MapMessage from "./MapMessage";
import MapTooltip from "./MapTooltip";
import RectangleSelectionTool from "./RectangleSelectionTool";
import store from "../../store";

interface Props {
  readonly project: IProject;
  readonly geojson: DistrictsGeoJSON;
  readonly staticMetadata: IStaticMetadata;
  readonly staticDemographics: UintArrays;
  readonly staticGeoLevels: UintArrays;
  readonly selectedGeounits: GeoUnits;
  readonly selectedDistrictId: number;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly lockedDistricts: LockedDistricts;
  readonly label?: string;
}

const DistrictsMap = ({
  project,
  geojson,
  staticMetadata,
  staticDemographics,
  staticGeoLevels,
  selectedGeounits,
  selectedDistrictId,
  selectionTool,
  geoLevelIndex,
  lockedDistricts,
  label
}: Props) => {
  const [map, setMap] = useState<MapboxGL.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Conversion from readonly -> mutable to match Mapbox interface
  const [b0, b1, b2, b3] = staticMetadata.bbox;

  const selectedGeolevel = getSelectedGeoLevel(staticMetadata.geoLevelHierarchy, geoLevelIndex);

  const minZoom = Math.min(...staticMetadata.geoLevelHierarchy.map(geoLevel => geoLevel.minZoom));
  const maxZoom = Math.max(...staticMetadata.geoLevelHierarchy.map(geoLevel => geoLevel.maxZoom));

  // While a geolevel has tiles up to the maxZoom level, we want the enable the user to zoom in
  // beyond that zoom level. Using lower zoom tiles at higher zoom levels is called overzoom.
  const overZoom = maxZoom + 4;

  // Add a color property to the geojson, so it can be used for styling
  geojson.features.forEach((feature, id) => {
    // @ts-ignore
    // eslint-disable-next-line
    feature.properties.color = getDistrictColor(id);
  });

  useEffect(() => {
    // eslint-disable-next-line
    if (mapRef.current === null) {
      return;
    }

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
      setMap(map);

      generateMapLayers(
        project.regionConfig.s3URI,
        project.regionConfig.regionCode,
        staticMetadata.geoLevelHierarchy,
        minZoom,
        maxZoom,
        map,
        geojson
      );

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

  // Update districts source when geojson is fetched
  useEffect(() => {
    const districtsSource = map && map.getSource(DISTRICTS_SOURCE_ID);
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);
  }, [map, geojson]);

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

  useEffect(() => {
    map &&
      [...new Array(project.numberOfDistricts + 1).keys()].forEach(districtId =>
        map.setFeatureState(featureStateDistricts(districtId), {
          locked: lockedDistricts.has(districtId)
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
        const geoUnitIdx = geoUnitIndices[0];
        const childGeoLevelIdx =
          staticMetadata.geoLevelHierarchy.length - geoUnitIndices.length - 1;
        const childGeoLevel = staticMetadata.geoLevelHierarchy[childGeoLevelIdx];
        const childGeoUnitIds = getAllIndices(
          staticGeoLevels[childGeoLevelIdx],
          new Set([geoUnitIdx])
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
        // NOTE: We can't use Mapbox's query functions to get the geounit data from the feature
        // since they require that the feature be within the viewport which we can't rely on.
        // Instead we recreate the geounit from static metadata.
        const childGeoUnits = {
          [childGeoLevel.id]: new Map(
            childGeoUnitIds.map((id, index) => [id, [...geoUnitIndices, index]])
          )
        };
        const unlockedChildGeoUnits = onlyUnlockedGeoUnits(
          project.districtsDefinition,
          lockedDistricts,
          childGeoUnits
        );
        // Update state
        store.dispatch(
          editSelectedGeounits({
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
      if (selectionTool === SelectionTool.Default) {
        DefaultSelectionTool.enable(
          map,
          selectedGeolevel.id,
          staticMetadata,
          project.districtsDefinition,
          lockedDistricts
        );
      } else if (selectionTool === SelectionTool.Rectangle) {
        RectangleSelectionTool.enable(
          map,
          selectedGeolevel.id,
          staticMetadata,
          project.districtsDefinition,
          lockedDistricts
        );
      }
      /* eslint-enable */
    }
  }, [
    map,
    selectionTool,
    selectedGeolevel,
    staticMetadata,
    staticDemographics,
    project,
    lockedDistricts
  ]);

  return (
    <Box ref={mapRef} sx={{ width: "100%", height: "100%", position: "relative" }}>
      <MapTooltip map={map || undefined} />
      <MapMessage />
      <AdvancedEditingModal id={project.id} geoLevels={staticMetadata.geoLevelHierarchy} />
    </Box>
  );
};

export default DistrictsMap;
