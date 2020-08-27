/** @jsx jsx */
import { FeatureCollection, MultiPolygon } from "geojson";
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
  DistrictProperties,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts
} from "../../../shared/entities";
import { getAllIndices } from "../../../shared/functions";
import {
  GEOLEVELS_SOURCE_ID,
  DISTRICTS_PLACEHOLDER_LAYER_ID,
  DISTRICTS_SOURCE_ID,
  DISTRICTS_LAYER_ID,
  featureStateDistricts,
  featuresToUnlockedGeoUnits,
  getMapboxStyle,
  getGeoLevelVisibility,
  levelToLabelLayerId,
  levelToLineLayerId,
  levelToSelectionLayerId
} from "./index";
import DefaultSelectionTool from "./DefaultSelectionTool";
import MapTooltip from "./MapTooltip";
import RectangleSelectionTool from "./RectangleSelectionTool";
import store from "../../store";

interface Props {
  readonly project: IProject;
  readonly geojson: FeatureCollection<MultiPolygon, DistrictProperties>;
  readonly staticMetadata: IStaticMetadata;
  readonly staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly selectedGeounits: GeoUnits;
  readonly selectedDistrictId: number;
  readonly selectionTool: SelectionTool;
  readonly geoLevelIndex: number;
  readonly lockedDistricts: LockedDistricts;
  readonly label?: string;
}

const Map = ({
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

  const selectedGeolevel =
    staticMetadata.geoLevelHierarchy[staticMetadata.geoLevelHierarchy.length - 1 - geoLevelIndex];

  const minZoom = Math.min(...staticMetadata.geoLevelHierarchy.map(geoLevel => geoLevel.minZoom));
  const maxZoom = Math.max(...staticMetadata.geoLevelHierarchy.map(geoLevel => geoLevel.maxZoom));
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

    const map = new MapboxGL.Map({
      container: mapRef.current,
      style: getMapboxStyle(
        project.regionConfig.s3URI,
        staticMetadata.geoLevelHierarchy,
        minZoom,
        maxZoom
      ),
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

      map.addSource(DISTRICTS_SOURCE_ID, {
        type: "geojson",
        data: geojson
      });
      map.addLayer(
        {
          id: DISTRICTS_LAYER_ID,
          type: "fill",
          source: DISTRICTS_SOURCE_ID,
          layout: {},
          paint: {
            "fill-color": { type: "identity", property: "color" },
            "fill-opacity": 1
          }
        },
        DISTRICTS_PLACEHOLDER_LAYER_ID
      );
      map.addLayer(
        {
          id: "districts-locked",
          type: "fill",
          source: DISTRICTS_SOURCE_ID,
          layout: {},
          paint: {
            "fill-pattern": "circle-1",
            "fill-opacity": ["case", ["boolean", ["feature-state", "locked"], false], 1, 0]
          }
        },
        DISTRICTS_PLACEHOLDER_LAYER_ID
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
      selectedGeounits.size === 0 &&
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

  useEffect(() => {
    // eslint-disable-next-line
    if (map) {
      // Restrict zoom levels as per geolevel hierarchy if features are selected.
      // Without this, zooming too far out before approving/cancelling a
      // selection could make the user's selection disappear since not all
      // layers are shown at each zoom level.
      const restrictZoom = () => {
        map.setMinZoom(selectedGeounits.size > 0 ? selectedGeolevel.minZoom : minZoom);
      };
      map.on("zoomstart", restrictZoom);

      return () => {
        map.off("zoomstart", restrictZoom);
      };
    }
  }, [map, selectedGeolevel, staticMetadata, selectedGeounits, minZoom]);

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
    // eslint-disable-next-line
    if (
      map &&
      prevGeoLevelIndex !== undefined &&
      geoLevelIndex > prevGeoLevelIndex &&
      selectedGeounits.size
    ) {
      [...selectedGeounits.entries()].forEach(([featureId, geoUnitIndices]) => {
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

        // HACK! Fit map bounds to the bounding box to ensure that all relevant features are
        // returned when querying (`map.queryRenderedFeatures` only returns features within the
        // viewport). This will be replaced later.
        map.fitBounds(staticMetadata.bbox as [number, number, number, number]); // eslint-disable-line
        map.once("moveend", () => {
          const geoLevel =
            staticMetadata.geoLevelHierarchy[
              staticMetadata.geoLevelHierarchy.length - geoUnitIndices.length
            ];
          // Select sub-geounits.
          const subFeatures = map.queryRenderedFeatures(undefined, {
            layers: [levelToSelectionLayerId(childGeoLevel.id)],
            filter: ["==", ["get", `${geoLevel.id}Idx`], geoUnitIdx]
          });
          const subGeoUnits = featuresToUnlockedGeoUnits(
            subFeatures,
            staticMetadata.geoLevelHierarchy,
            project.districtsDefinition,
            lockedDistricts
          );
          // Deselect selected geounit
          const selectedFeatures = map.queryRenderedFeatures(undefined, {
            layers: [levelToSelectionLayerId(geoLevel.id)],
            filter: ["==", ["get", "idx"], geoUnitIdx]
          });
          map.removeFeatureState({
            id: featureId,
            source: GEOLEVELS_SOURCE_ID,
            sourceLayer: geoLevel.id
          });
          // NOTE: There should only be only one selected feature/geounit
          const selectedGeounits = featuresToUnlockedGeoUnits(
            selectedFeatures,
            staticMetadata.geoLevelHierarchy,
            project.districtsDefinition,
            lockedDistricts
          );
          // Update state
          store.dispatch(
            editSelectedGeounits({
              add: subGeoUnits,
              remove: selectedGeounits
            })
          );
        });
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
    </Box>
  );
};

export default Map;
