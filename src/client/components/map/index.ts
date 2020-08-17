import MapboxGL, { MapboxGeoJSONFeature } from "mapbox-gl";
import { join } from "path";
import { s3ToHttps } from "../../s3";

import {
  GeoUnitCollection,
  DistrictId,
  DistrictsDefinition,
  FeatureId,
  GeoLevelInfo,
  GeoUnitIndices,
  GeoUnits,
  IStaticMetadata,
  LockedDistricts
} from "../../../shared/entities";

// Vector tiles with geolevel data for this geography
export const GEOLEVELS_SOURCE_ID = "db";
// GeoJSON district data for district as currently drawn
export const DISTRICTS_SOURCE_ID = "districts";
// GeoJSON district label data for district as currently drawn
export const DISTRICTS_LABELS_SOURCE_ID = "districts-labels";
// Id for districts layer
export const DISTRICTS_LAYER_ID = "districts";
// Id for district label layer
export const DISTRICTS_LABELS_LAYER_ID = "districts-labels";
// Used only to make labels show up on top of all other layers
export const DISTRICTS_PLACEHOLDER_LAYER_ID = "district-placeholder";

export function getMapboxStyle(path: string, geoLevels: readonly GeoLevelInfo[]): MapboxGL.Style {
  const lineLayers = geoLevels.flatMap(level => [
    {
      id: levelToLineLayerId(level.id),
      type: "line",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": level.id,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#000",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.1, 6, 0.1, 12, 0.2],
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 12, 2]
      }
    }
  ]);

  const selectionLayers = geoLevels.flatMap(level => [
    {
      id: levelToSelectionLayerId(level.id),
      type: "fill",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": level.id,
      paint: {
        "fill-color": "#000",
        "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.5, 0]
      }
    }
  ]);

  const labelLayers = geoLevels.flatMap(level => [
    {
      id: levelToLabelLayerId(level.id),
      type: "symbol",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": `${level.id}labels`,
      layout: {
        "text-size": 12,
        "text-padding": 3,
        "text-field": "",
        "text-justify": "center",
        "text-max-width": 10,
        "text-font": ["ag-r"],
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
  ]);

  return {
    layers: [
      {
        id: DISTRICTS_PLACEHOLDER_LAYER_ID,
        type: "background",
        paint: {
          "background-color": "transparent"
        },
        layout: {
          visibility: "none"
        }
      },
      ...selectionLayers,
      ...lineLayers,
      ...labelLayers
    ] as MapboxGL.Layer[], // eslint-disable-line
    glyphs: window.location.origin + "/fonts/{fontstack}/{range}.pbf",
    sprite: window.location.origin + "/sprites/sprite",
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
export function levelToLabelLayerId(geoLevel: string) {
  return `${geoLevel}-label`;
}

// Retuns a line layer id given the geolevel
export function levelToLineLayerId(geoLevel: string) {
  return `${geoLevel}-line`;
}

// Retuns a selection layer id given the geolevel
export function levelToSelectionLayerId(geoLevel: string) {
  return `${geoLevel}-selected`;
}

/*
 * Used for getting/setting feature state for geounits in geography.
 */
export function featureStateGeoLevel(feature: MapboxGL.MapboxGeoJSONFeature) {
  return {
    source: GEOLEVELS_SOURCE_ID,
    id: feature.id,
    sourceLayer: feature.sourceLayer
  };
}

/*
 * Used for getting/setting feature state for districts.
 */
export function featureStateDistricts(districtId: DistrictId) {
  return {
    source: DISTRICTS_SOURCE_ID,
    id: districtId
  };
}

export function isFeatureSelected(
  map: MapboxGL.Map,
  feature: MapboxGL.MapboxGeoJSONFeature
): boolean {
  const featureState = map.getFeatureState(featureStateGeoLevel(feature));
  return featureState.selected === true;
}

function isGeoUnitLocked(
  districtsDefinition: GeoUnitCollection,
  lockedDistricts: LockedDistricts,
  geoUnitIndices: GeoUnitIndices
): boolean {
  return geoUnitIndices.length && typeof districtsDefinition === "object"
    ? isGeoUnitLocked(
        districtsDefinition[geoUnitIndices[0]],
        lockedDistricts,
        geoUnitIndices.slice(1)
      )
    : typeof districtsDefinition === "number"
    ? // Check if this specific district is locked
      lockedDistricts.has(districtsDefinition)
    : // Check if any district at this geolevel is locked
      districtsDefinition.some(
        districtId => typeof districtId === "number" && lockedDistricts.has(districtId)
      );
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

function featuresToGeoUnits(
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

function onlyUnlockedFeatures(
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts,
  geoUnits: GeoUnits
): GeoUnits {
  return new Map(
    [...geoUnits.entries()].filter(
      ([, geoUnitIndices]) => !isGeoUnitLocked(districtsDefinition, lockedDistricts, geoUnitIndices)
    )
  );
}

export function featuresToUnlockedGeoUnits(
  features: readonly MapboxGeoJSONFeature[],
  geoLevelHierarchy: readonly GeoLevelInfo[],
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts
): GeoUnits {
  return onlyUnlockedFeatures(
    districtsDefinition,
    lockedDistricts,
    featuresToGeoUnits(features, geoLevelHierarchy)
  );
}
