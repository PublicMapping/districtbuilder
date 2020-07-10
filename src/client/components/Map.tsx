import { FeatureCollection, MultiPolygon } from "geojson";
import { join } from "path";
import React, { useEffect, useRef, useState } from "react";

import MapboxGL from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { addSelectedGeounitIds, removeSelectedGeounitIds } from "../actions/districtDrawing";
import { getDistrictColor } from "../constants/colors";
import { DistrictProperties, GeoLevelInfo, IProject, IStaticMetadata } from "../../shared/entities";
import { getAllIndices, getDemographics } from "../../shared/functions";
import { s3ToHttps } from "../s3";
import store from "../store";

const styles = {
  width: "100%",
  height: "100%"
};

const source = "db";

interface Props {
  readonly project: IProject;
  readonly geojson: FeatureCollection<MultiPolygon, DistrictProperties>;
  readonly staticMetadata: IStaticMetadata;
  readonly staticGeoLevels: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>;
  readonly selectedGeounitIds: ReadonlySet<number>;
  readonly selectedDistrictId: number;
}

// Retuns a line layer id given the geolevel
function levelToLineLayerId(geoLevel: string) {
  return `${geoLevel}-line`;
}

// Retuns a selection layer id given the geolevel
function levelToSelectionLayerId(geoLevel: string) {
  return `${geoLevel}-selected`;
}

function getMapboxStyle(path: string, geoLevels: readonly GeoLevelInfo[]): MapboxGL.Style {
  return {
    layers: geoLevels.flatMap(level => [
      {
        id: levelToLineLayerId(level.id),
        type: "line",
        source,
        "source-layer": level.id,
        paint: {
          "line-color": "#000",
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.1, 6, 0.1, 12, 0.2],
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 12, 2]
        }
      },
      {
        id: levelToSelectionLayerId(level.id),
        type: "fill",
        source,
        "source-layer": level.id,
        paint: {
          "fill-color": "#000",
          "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.5, 0]
        }
      }
    ]),
    name: "District Builder",
    sources: {
      db: {
        type: "vector",
        tiles: [join(s3ToHttps(path), "tiles/{z}/{x}/{y}.pbf")],
        minzoom: 4,
        maxzoom: 12
      }
    },
    version: 8
  };
}

const Map = ({
  project,
  geojson,
  staticMetadata,
  staticGeoLevels,
  staticDemographics,
  selectedGeounitIds,
  selectedDistrictId
}: Props) => {
  const [map, setMap] = useState<MapboxGL.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Conversion from readonly -> mutable to match Mapbox interface
  const [b0, b1, b2, b3] = staticMetadata.bbox;

  // At the moment, we are only interacting with the top geolevel (e.g. County)
  const topGeoLevel =
    staticMetadata.geoLevelHierarchy[staticMetadata.geoLevelHierarchy.length - 1].id;

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
        minZoom: 5,
        maxZoom: 15
      });

      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.doubleClickZoom.disable();

      map.on("load", () => {
        setMap(map);

        map.addSource("districts", {
          type: "geojson",
          data: geojson
        });
        map.addLayer({
          id: "districts",
          type: "fill",
          source: "districts",
          layout: {},
          paint: {
            "fill-color": { type: "identity", property: "color" },
            "fill-opacity": 0.7
          }
        });

        map.resize();
      });

      // Add a click event to the top geolevel that logs demographic information.
      // Note that the feature can't be directly selected under the cursor, so
      // we need to use a small bounding box and select the first feature we find.
      map.on("click", e => {
        const buffer = 1;
        const southWest: MapboxGL.PointLike = [e.point.x - buffer, e.point.y - buffer];
        const northEast: MapboxGL.PointLike = [e.point.x + buffer, e.point.y + buffer];
        const features = map.queryRenderedFeatures([southWest, northEast], {
          layers: [levelToSelectionLayerId(topGeoLevel)]
        });

        // Disabling 'functional/no-conditional-statement' without naming it.
        // See https://github.com/jonaskello/eslint-plugin-functional/issues/105
        // eslint-disable-next-line
        if (features.length === 0 || typeof features[0].id !== "number") {
          // eslint-disable-next-line
          console.log("No features selected. ", features);
          return;
        }
        const feature = features[0];
        const featureId = feature.id as number;

        // Set the selected feature, or de-select it if it's already selected
        const featureStateExpression = { source, id: featureId, sourceLayer: topGeoLevel };
        const featureState = map.getFeatureState(featureStateExpression);
        const selectedFeatures = new Set([featureId]);
        const addFeatures = () => {
          map.setFeatureState(featureStateExpression, { selected: true });
          store.dispatch(addSelectedGeounitIds(selectedFeatures));
        };
        const removeFeatures = () => {
          map.setFeatureState(featureStateExpression, { selected: false });
          store.dispatch(removeSelectedGeounitIds(selectedFeatures));
        };
        featureState.selected ? removeFeatures() : addFeatures();

        // Indices of all base geounits belonging to the clicked feature
        const baseIndices = getAllIndices(
          staticGeoLevels[staticGeoLevels.length - 1],
          new Set([featureId])
        );
        const demographics = getDemographics(baseIndices, staticMetadata, staticDemographics);

        // As a proof of concept, log to the console the aggregated demographic data for the feature
        // eslint-disable-next-line
        console.log(demographics);
      });
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
    const districtsSource = map && map.getSource("districts");
    districtsSource && districtsSource.type === "geojson" && districtsSource.setData(geojson);
  }, [map, geojson]);

  // Remove selected features from map when selected geounit ids has been emptied
  useEffect(() => {
    const removeSelectedFeatures = (map: MapboxGL.Map) =>
      map.removeFeatureState({ source, sourceLayer: topGeoLevel });
    map &&
      selectedGeounitIds.size === 0 &&
      (selectedDistrictId === 0
        ? removeSelectedFeatures(map)
        : // When adding or changing the district to which a geounit is
        // assigned, wait until districts GeoJSON is updated before removing
        // selected state.
        map.isStyleLoaded() && map.isSourceLoaded("districts")
        ? removeSelectedFeatures(map)
        : map.once("idle", () => removeSelectedFeatures(map)));
    // We don't want to tigger this effect when `selectedDistrictId` changes
    // eslint-disable-next-line
  }, [map, selectedGeounitIds, topGeoLevel]);

  return <div ref={mapRef} style={styles} />;
};

export default Map;
