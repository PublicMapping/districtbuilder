/** @jsx jsx */
import { FeatureCollection, MultiPolygon } from "geojson";
import { useEffect, useRef, useState } from "react";
import { Box, jsx } from "theme-ui";
import flatten from "geojson-flatten";
import polylabel from "polylabel";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { setGeoLevelVisibility, SelectionTool } from "../../actions/districtDrawing";
import { getDistrictColor } from "../../constants/colors";
import {
  DistrictProperties,
  GeoUnits,
  IProject,
  IStaticMetadata,
  LockedDistricts
} from "../../../shared/entities";
import {
  GEOLEVELS_SOURCE_ID,
  DISTRICTS_PLACEHOLDER_LAYER_ID,
  DISTRICTS_SOURCE_ID,
  DISTRICTS_LABELS_SOURCE_ID,
  DISTRICTS_LAYER_ID,
  DISTRICTS_LABELS_LAYER_ID,
  featureStateDistricts,
  getMapboxStyle,
  getGeoLevelVisibility,
  levelToLabelLayerId,
  levelToLineLayerId
} from "./index";
import DefaultSelectionTool from "./DefaultSelectionTool";
import MapTooltip from "./MapTooltip";
import RectangleSelectionTool from "./RectangleSelectionTool";
import store from "../../store";

interface Props {
  readonly project: IProject;
  readonly geojson: FeatureCollection<MultiPolygon, DistrictProperties>;
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
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
  staticGeoLevels,
  staticDemographics,
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

  // Add a color property to the geojson, so it can be used for styling
  geojson.features.forEach((feature, id) => {
    // @ts-ignore
    // eslint-disable-next-line
    feature.properties.color = getDistrictColor(id);
  });

  useEffect(() => {
    const initializeMap = (setMap: (map: MapboxGL.Map) => void, mapContainer: HTMLDivElement) => {
      const map = new MapboxGL.Map({
        container: mapContainer,
        style: getMapboxStyle(project.regionConfig.s3URI, staticMetadata.geoLevelHierarchy),
        bounds: [b0, b1, b2, b3],
        fitBoundsOptions: { padding: 20 },
        minZoom,
        maxZoom
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
      setLevelVisibility();

      map.on("load", () => {
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

        map.addSource(DISTRICTS_LABELS_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        });
        map.addLayer({
          id: DISTRICTS_LABELS_LAYER_ID,
          type: "symbol",
          source: DISTRICTS_LABELS_SOURCE_ID,
          layout: {
            "text-size": 12,
            "text-padding": 3,
            "text-field": ["concat", project.regionConfig.regionCode, "-", ["get", "id"]],
            "text-max-width": 10,
            "text-font": ["ag-bo"]
          },
          paint: {
            "text-color": "#000",
            "text-opacity": 0.9,
            "text-halo-color": "#fff",
            "text-halo-width": 1.25,
            "text-halo-blur": 0
          }
        });

        map.resize();
      });

      map.on("zoomend", setLevelVisibility);
    };

    // eslint-disable-next-line
    if (!map && mapRef.current != null) {
      initializeMap(setMap, mapRef.current);
    }
    // eslint complains that this useEffect should depend on map, but we're using this to call setMap so that wouldn't make sense
    // eslint-disable-next-line
  }, []);

  // Update districts source when geojson is fetched
  useEffect(() => {
    const districtsSource = map && map.getSource(DISTRICTS_SOURCE_ID);
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);

    console.time("labels");

    const labels = geojson.features
      .filter(feature => {
        return feature.geometry.coordinates.length > 0 && feature.id !== 0;
      })
      .map(feature => {
        return flatten(feature).reduce((prev: any, current: any) => {
          // If a district contains multiple polygons, label the polygon with the fewest vertices
          return prev.geometry.coordinates[0].length > current.geometry.coordinates[0].length
            ? prev
            : current;
        });
      })
      .map(feature => {
        return {
          type: "Feature",
          properties: { id: feature.id },
          geometry: {
            type: "Point",
            coordinates: polylabel(feature.geometry.coordinates, 0.5)
          }
        };
      });

    const districtsLabelsSource = map && map.getSource(DISTRICTS_LABELS_SOURCE_ID);

    districtsLabelsSource &&
      districtsLabelsSource.type === "geojson" &&
      //@ts-ignore
      districtsLabelsSource.setData({
        type: "FeatureCollection",
        //@ts-ignore
        features: labels
      });

    console.timeEnd("labels");
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
    geoLevelIndex,
    staticMetadata,
    staticDemographics,
    staticGeoLevels,
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
