import MapboxGL, { MapboxGeoJSONFeature } from "mapbox-gl";
import { join } from "path";
import { s3ToHttps } from "../../s3";

import { FeatureId, GeoLevelInfo, GeoUnits, IStaticMetadata } from "../../../shared/entities";

// Vector tiles with geolevel data for this geography
export const GEOLEVELS_SOURCE_ID = "db";
// GeoJSON district data for district as currently drawn
export const DISTRICTS_SOURCE_ID = "districts";
// Id for districts layer
export const DISTRICTS_LAYER_ID = "districts";

export function getMapboxStyle(path: string, geoLevels: readonly GeoLevelInfo[]): MapboxGL.Style {
  return {
    layers: geoLevels.flatMap(level => [
      {
        id: levelToLineLayerId(level.id),
        type: "line",
        source: GEOLEVELS_SOURCE_ID,
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
        source: GEOLEVELS_SOURCE_ID,
        "source-layer": level.id,
        paint: {
          "fill-color": "#000",
          "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.5, 0]
        }
      },
      {
        id: levelToLabelLayerId(level.id),
        type: "symbol",
        source: GEOLEVELS_SOURCE_ID,
        "source-layer": `${level.id}labels`,
        layout: {
          "text-size": 12,
          "text-padding": 3,
          "text-field": "{population}",
          "text-max-width": 10,
          "text-font": ["GR"],
          visibility: "none"
        },
        paint: {
          "text-color": "#000",
          "text-opacity": 0.9,
          "text-halo-color": "#fff",
          "text-halo-width": 1.25,
          "text-halo-blur": 0
        }
      }
    ]),
    glyphs: window.location.origin + "/fonts/{fontstack}/{range}.pbf",
    name: "District Builder",
    sources: {
      [GEOLEVELS_SOURCE_ID]: {
        type: "vector",
        tiles: [join(s3ToHttps(path), "tiles/{z}/{x}/{y}.pbf")],
        minzoom: 4,
        maxzoom: 12
      }
    },
    version: 8
  };
}

// Retuns a label layer id given the geolevel
function levelToLabelLayerId(geoLevel: string) {
  return `${geoLevel}-label`;
}

// Retuns a line layer id given the geolevel
function levelToLineLayerId(geoLevel: string) {
  return `${geoLevel}-line`;
}

// Retuns a selection layer id given the geolevel
export function levelToSelectionLayerId(geoLevel: string) {
  return `${geoLevel}-selected`;
}

/*
 * Used for getting/setting feature state.
 */
export function featureStateExpression(feature: MapboxGL.MapboxGeoJSONFeature) {
  return {
    source: GEOLEVELS_SOURCE_ID,
    id: feature.id,
    sourceLayer: feature.sourceLayer
  };
}

export function isFeatureSelected(
  map: MapboxGL.Map,
  feature: MapboxGL.MapboxGeoJSONFeature
): boolean {
  const featureState = map.getFeatureState(featureStateExpression(feature));
  return featureState.selected === true;
}

export function getGeoLevelVisibility(
  map: MapboxGL.Map,
  staticMetadata: IStaticMetadata
): readonly boolean[] {
  const mapZoom = map.getZoom();
  return staticMetadata.geoLevelHierarchy
    .slice()
    .reverse()
    .map(geoLevel => mapZoom <= geoLevel.maxZoom && mapZoom >= geoLevel.minZoom);
}

/* eslint-disable */
export interface ISelectionTool {
  enable: (map: MapboxGL.Map, ...args: any) => void;
  disable: (map: MapboxGL.Map, ...args: any) => void;
  [x: string]: any;
}
/* eslint-enable */

export function featuresToSet(
  features: readonly MapboxGeoJSONFeature[],
  geoLevelHierarchy: readonly GeoLevelInfo[]
): GeoUnits {
  const geoLevelHierarchyKeys = ["idx", ...geoLevelHierarchy.map(geoLevel => `${geoLevel.id}Idx`)];
  // Map is used here instead of Set because Sets don't work well for handling
  // objects (multiple copies of an object with the same values can exist in
  // the same set). Here the feature id is used as the key which we also want
  // to keep track of for map management. Note that if keys are duplicated the
  // value set last will be used (thus achieving the uniqueness of sets).
  return new Map(
    features.map((feature: MapboxGeoJSONFeature) => [
      feature.id as FeatureId,
      geoLevelHierarchyKeys.reduce(
        (geounitData, key) => {
          const geounitId = feature.properties && feature.properties[key];
          return geounitId !== undefined && geounitId !== null
            ? [geounitId, ...geounitData]
            : geounitData;
        },
        [] as readonly number[]
      )
    ])
  );
}
