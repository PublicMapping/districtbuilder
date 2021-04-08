import MapboxGL, { MapboxGeoJSONFeature } from "mapbox-gl";
import { cloneDeep } from "lodash";
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
  MutableGeoUnits,
  IStaticMetadata,
  LockedDistricts,
  UintArrays,
  EvaluateMetricWithValue
} from "../../../shared/entities";
import { getAllIndices } from "../../../shared/functions";
import { isBaseGeoLevelAlwaysVisible } from "../../functions";

// Vector tiles with geolevel data for this geography
export const GEOLEVELS_SOURCE_ID = "db";
// GeoJSON district data for district as currently drawn
export const DISTRICTS_SOURCE_ID = "districts";
// Id for districts layer
export const DISTRICTS_LAYER_ID = "districts";
// Id for districts layer outline, used for Find
export const DISTRICTS_OUTLINE_LAYER_ID = "districts-outline";
// Id for districts fill outline used in evaluate mode
export const DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID = "districts-contiguity";
// Id for districts layer outline used in evaluate mode
export const DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID = "districts-compactness";
// Id for districts layer outline used in evaluate mode
export const DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID = "districts-equal-population";
// Id for districts layer outline used in evaluate mode
export const DISTRICTS_EVALUATE_LAYER_ID = "districts-evaluate";
// Id for topmost geolevel layer in Evaluate
export const TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID = "topmost-geo-evaluate-split";
// Id for topmost geolevel layer fill in Evaluate
export const TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID = "topmost-geo-evaluate-split-fill";
// Used only to make districts appear in the correct position in the layer stack
export const DISTRICTS_PLACEHOLDER_LAYER_ID = "district-placeholder";
// Used only to make highlights appear in the correct position in the layer stack
export const HIGHLIGHTS_PLACEHOLDER_LAYER_ID = "highlight-placeholder";
// Used only to make lines appear in the correct position in the layer stack
export const LINES_PLACEHOLDER_LAYER_ID = "line-placeholder";
// Used only to make labels appear in the correct position in the layer stack
export const LABELS_PLACEHOLDER_LAYER_ID = "label-placeholder";

// Delay used to throttle calls to set the current feature(s), in milliseconds
export const SET_FEATURE_DELAY = 300;
export const CONTIGUITY_FILL_COLOR = "#9400D3";
export const EVALUATE_GRAY_FILL_COLOR = "#D3D3D3";
export const COUNTY_SPLIT_FILL_COLOR = "#fed8b1";

// Layers in the Mapbox Studio project that we filter to only show the active region.
const filteredLabelLayers = [
  "settlement-major-label",
  "settlement-minor-label",
  "settlement-subdivision-label",
  "poi-label"
];

export function getChoroplethStops(metricKey: string, threshold?: number) {
  const compactnessSteps = [
    [0.3, "#edf8fb"],
    [0.4, "#b2e2e2"],
    [0.5, "#66c2a4"],
    [0.6, "#2ca25f"],
    [1.0, "#006d2c"]
  ];
  const popThreshold = threshold || 0.05;
  const equalPopulationSteps = [
    [-1.0, "#D1E5F0"],
    [-1 * (popThreshold + 0.02), "#66A9CF"],
    [-1 * (popThreshold + 0.01), "#2166AC"],
    [-1 * popThreshold, "#01665E"],
    [popThreshold, "#EFBE60"],
    [popThreshold + 0.01, "#F5D092"],
    [popThreshold + 0.02, "#F7E1C3"]
  ];
  switch (metricKey) {
    case "compactness":
      return compactnessSteps;
    case "equalPopulation":
      return equalPopulationSteps;
    default:
      return [];
  }
}

export function getChoroplethLabels(metricKey: string) {
  const compactnessLabels = ["0-30%", "30-40%", "40-50%", "50-60%", ">60%"];
  const steps = getChoroplethStops(metricKey);
  switch (metricKey) {
    case "compactness":
      return compactnessLabels;
    case "equalPopulation":
      return steps.map((step, i) => {
        const stepVal = Number(step[0]);
        if (i === 0) {
          // Lower bound condition
          return `< ${Math.ceil(Number(steps[1][0]) * 100)}%`;
        } else if (i === steps.length - 1) {
          // Upper bound condition
          return `> ${Math.floor(stepVal * 100)}%`;
        } else {
          const nextStep = Number(steps[i + 1][0]);
          if (stepVal < 0 && nextStep > 0) {
            // Target condition
            return `Target (+/- ${Math.floor(nextStep * 100)}%)`;
          } else {
            if (stepVal < 0) {
              return `${Math.ceil(stepVal * 100)}% to ${Math.ceil(nextStep * 100)}%`;
            } else {
              return `${Math.floor(stepVal * 100)}% to ${Math.floor(nextStep * 100)}%`;
            }
          }
        }
      });
    default:
      return [];
  }
}

export function getGeolevelLinePaintStyle(geoLevel: string) {
  const largeGeolevel = {
    "line-color": "#000",
    "line-opacity": 1,
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.5, 14, 4.5]
  };

  const mediumGeolevel = {
    "line-color": "#000",
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.2, 14, 0.6],
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.75, 14, 2.25]
  };

  const smallGeolevel = {
    "line-color": "#000",
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.1, 14, 0.3],
    "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0, 14, 1.5]
  };

  switch (geoLevel) {
    case "county":
      return largeGeolevel;
    case "tract":
      return mediumGeolevel;
    case "blockgroup":
      return mediumGeolevel;
    case "block":
      return smallGeolevel;
    default:
      return smallGeolevel;
  }
}

export function generateMapLayers(
  path: string,
  regionCode: string,
  geoLevels: readonly GeoLevelInfo[],
  minZoom: number,
  maxZoom: number,
  /* eslint-disable */
  map: any,
  geojson: any,
  metric?: EvaluateMetricWithValue
  /* eslint-enable */
) {
  map.addSource(DISTRICTS_SOURCE_ID, {
    type: "geojson",
    data: geojson
  });

  map.addSource(GEOLEVELS_SOURCE_ID, {
    type: "vector",
    tiles: [join(s3ToHttps(path), "tiles/{z}/{x}/{y}.pbf")],
    minzoom: minZoom,
    maxzoom: maxZoom
  });

  map.addLayer(
    {
      id: DISTRICTS_LAYER_ID,
      type: "fill",
      source: DISTRICTS_SOURCE_ID,
      layout: {},
      paint: {
        "fill-color": { type: "identity", property: "color" },
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.66, 14, 0.45],
        "fill-antialias": false
      }
    },
    DISTRICTS_PLACEHOLDER_LAYER_ID
  );

  map.addLayer(
    {
      id: DISTRICTS_COMPACTNESS_CHOROPLETH_LAYER_ID,
      type: "fill",
      source: DISTRICTS_SOURCE_ID,
      layout: { visibility: "none" },
      filter: ["match", ["get", "color"], ["transparent"], false, true],
      paint: {
        "fill-color": {
          property: "compactness",
          stops: getChoroplethStops("compactness")
        },
        "fill-outline-color": "gray",
        "fill-opacity": 0.9
      }
    },
    LABELS_PLACEHOLDER_LAYER_ID
  );

  map.addLayer(
    {
      id: DISTRICTS_EQUAL_POPULATION_CHOROPLETH_LAYER_ID,
      type: "fill",
      source: DISTRICTS_SOURCE_ID,
      layout: { visibility: "none" },
      filter: ["match", ["get", "color"], ["transparent"], false, true],
      paint: {
        "fill-color": {
          property: "percentDeviation",
          type: "interval",
          stops: getChoroplethStops("equalPopulation")
        },
        "fill-outline-color": "gray",
        "fill-opacity": 0.9
      }
    },
    LABELS_PLACEHOLDER_LAYER_ID
  );

  map.addLayer(
    {
      id: DISTRICTS_OUTLINE_LAYER_ID,
      type: "line",
      source: DISTRICTS_SOURCE_ID,
      paint: {
        "line-color": { type: "identity", property: "outlineColor" },
        "line-opacity": 1,
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2, 14, 5]
      }
    },
    LABELS_PLACEHOLDER_LAYER_ID
  );

  map.addLayer(
    {
      id: DISTRICTS_EVALUATE_LAYER_ID,
      type: "line",
      source: DISTRICTS_SOURCE_ID,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#000",
        "line-opacity": 1,
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2, 14, 5]
      }
    },
    LABELS_PLACEHOLDER_LAYER_ID
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
  map.addLayer(
    {
      id: TOPMOST_GEOLEVEL_EVALUATE_SPLIT_ID,
      type: "line",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": geoLevels[geoLevels.length - 1].id,
      layout: { visibility: "none" },
      paint: {
        "line-color": "#D3D3D3",
        "line-opacity": 1,
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 2, 14, 5]
      }
    },
    LINES_PLACEHOLDER_LAYER_ID
  );

  map.addLayer(
    {
      id: TOPMOST_GEOLEVEL_EVALUATE_FILL_SPLIT_ID,
      source: GEOLEVELS_SOURCE_ID,
      type: "fill",
      "source-layer": geoLevels[geoLevels.length - 1].id,
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#fed8b1",
        "fill-opacity": ["case", ["boolean", ["feature-state", "split"], false], 0.5, 0.0],
        "fill-antialias": false
      }
    },
    LINES_PLACEHOLDER_LAYER_ID
  );

  map.addLayer(
    {
      id: DISTRICTS_CONTIGUITY_CHLOROPLETH_LAYER_ID,
      type: "fill",
      source: DISTRICTS_SOURCE_ID,
      layout: { visibility: "none" },
      filter: ["match", ["get", "color"], ["transparent"], false, true],
      paint: {
        "fill-color": [
          "match",
          ["get", "contiguity"],
          "contiguous",
          CONTIGUITY_FILL_COLOR,
          "non-contiguous",
          EVALUATE_GRAY_FILL_COLOR,
          "black"
        ],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.66, 14, 0.45],
        "fill-antialias": false
      }
    },
    LABELS_PLACEHOLDER_LAYER_ID
  );

  geoLevels.forEach(level => {
    map.addLayer(
      {
        id: levelToLineLayerId(level.id),
        type: "line",
        source: GEOLEVELS_SOURCE_ID,
        "source-layer": level.id,
        layout: { visibility: "none" },
        paint: getGeolevelLinePaintStyle(level.id)
      },
      LINES_PLACEHOLDER_LAYER_ID
    );
  });

  geoLevels.forEach(level => {
    map.addLayer(
      {
        id: levelToSelectionLayerId(level.id),
        type: "fill",
        source: GEOLEVELS_SOURCE_ID,
        "source-layer": level.id,
        paint: {
          "fill-color": "#000",
          "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.5, 0],
          "fill-antialias": false
        }
      },
      HIGHLIGHTS_PLACEHOLDER_LAYER_ID
    );
  });

  geoLevels.forEach(level => {
    map.addLayer({
      id: levelToLabelLayerId(level.id),
      type: "symbol",
      source: GEOLEVELS_SOURCE_ID,
      "source-layer": `${level.id}labels`,
      layout: {
        "text-size": 13,
        "text-padding": 2,
        "text-field": "",
        "text-max-width": 10,
        "text-font": ["Atlas Grotesk Bold"],
        visibility: "none"
      },
      paint: {
        "text-color": "#222",
        "text-opacity": 1,
        "text-halo-color": "#fff",
        "text-halo-width": 1,
        "text-halo-blur": 0
      }
    });
  });

  // These are layers that already exist and have their own filters. First, we get the
  // existing filter, then merge that with a custom filter that only shows labels from
  // the selected region. Finally, we set the layer to visible. In Mapbox Studio, the
  // layer was set to invisible to avoid a flash where the labels appear before the filter
  // is applied.
  filteredLabelLayers.forEach(layer => {
    map.setFilter(layer, [
      "all",
      map.getFilter(layer),
      ["match", ["get", "iso_3166_2"], [`US-${regionCode}`], true, false]
    ]);
    map.setLayoutProperty(layer, "visibility", "visible");
  });
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

type FeatureLike = Pick<MapboxGL.MapboxGeoJSONFeature, "id" | "sourceLayer">;

/*
 * Used for getting/setting feature state for geounits in geography.
 */
export function featureStateGeoLevel(feature: FeatureLike) {
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

export function isFeatureSelected(map: MapboxGL.Map, feature: FeatureLike): boolean {
  const featureState = map.getFeatureState(featureStateGeoLevel(feature));
  return featureState.selected === true;
}

/*
 * Returns true if this geounit or any of its children are locked.
 */
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
      lockedDistricts[districtsDefinition]
    : // Check if any district at this geolevel is locked
      districtsDefinition.some(districtId =>
        typeof districtId === "number"
          ? // Whole district is assigned so it can be looked up directly
            lockedDistricts[districtId]
          : // District definition has more nesting so it must be followed further
            isGeoUnitLocked(districtId, lockedDistricts, geoUnitIndices)
      );
}

export function setFeaturesSelectedFromGeoUnits(
  map: MapboxGL.Map,
  geoUnits: GeoUnits,
  selected: boolean
) {
  Object.entries(geoUnits).forEach(([geoLevelId, geoUnitsForLevel]) => {
    [...geoUnitsForLevel.keys()].forEach(featureId => {
      const currentFeature = { id: featureId, sourceLayer: geoLevelId };
      map.setFeatureState(featureStateGeoLevel(currentFeature), { selected });
    });
  });
}

/*
 * Filter matching geounits given an include function
 */
export function filterGeoUnits(units: GeoUnits, includeFn: (id: number) => boolean) {
  return Object.entries(units).reduce((newGeoUnits, [geoLevelId, geoUnitsForLevel]) => {
    return {
      ...newGeoUnits,
      [geoLevelId]: new Map([...geoUnitsForLevel].filter(([id]) => includeFn(id)))
    };
  }, units);
}

export function deselectChildGeounits(
  map: MapboxGL.Map,
  geoUnits: GeoUnits,
  staticMetadata: IStaticMetadata,
  staticGeoLevels: UintArrays
) {
  const isBaseLevelAlwaysVisible = isBaseGeoLevelAlwaysVisible(staticMetadata.geoLevelHierarchy);

  // Deselect any child features as appropriate (this comes into a play when, for example, a
  // blockgroup is selected and then the county _containing_ that blockgroup is selected)
  Object.values(geoUnits).forEach(geoUnitsForLevel => {
    geoUnitsForLevel.forEach(geoUnitIndices => {
      // Ignore bottom geolevel, because it can't have sub-features. And if the base geolevel
      // is not always visible, we can also ignore one additional geolevel, because these base
      // geounits can't be selected at the same time as features from one geolevel up).
      const numLevelsToIgnore = isBaseLevelAlwaysVisible ? 1 : 2;

      // eslint-disable-next-line
      if (geoUnitIndices.length <= staticMetadata.geoLevelHierarchy.length - numLevelsToIgnore) {
        const { childGeoUnits } = getChildGeoUnits(geoUnitIndices, staticMetadata, staticGeoLevels);
        setFeaturesSelectedFromGeoUnits(map, childGeoUnits, false);
      }
    });
  });
}

export function getGeoLevelVisibility(
  map: MapboxGL.Map,
  staticMetadata: IStaticMetadata
): readonly boolean[] {
  const mapZoom = map.getZoom();
  return staticMetadata.geoLevelHierarchy
    .slice()
    .reverse()
    .map(geoLevel => mapZoom >= geoLevel.minZoom);
}

/* eslint-disable */
export interface ISelectionTool {
  enable: (map: MapboxGL.Map, ...args: any) => void;
  disable: (map: MapboxGL.Map, ...args: any) => void;
  [x: string]: any;
}
/* eslint-enable */

/*
 * Return GeoUnits for given features.
 *
 * Note that this doesn't take whether a feature is locked or not into account. If the features
 * could possibly be locked then `featuresToUnlockedGeoUnits` should be used.
 */
export function featuresToGeoUnits(
  features: readonly MapboxGeoJSONFeature[],
  geoLevelHierarchy: readonly GeoLevelInfo[]
): GeoUnits {
  const geoLevelIds = geoLevelHierarchy.map(geoLevel => geoLevel.id);
  const geoLevelHierarchyKeys = ["idx", ...geoLevelIds.map(geoLevelId => `${geoLevelId}Idx`)];
  return geoLevelIds.reduce((geounitData: GeoUnits, geoLevelId) => {
    // Map is used here instead of Set because Sets don't work well for handling
    // objects (multiple copies of an object with the same values can exist in
    // the same set). Here the feature id is used as the key which we also want
    // to keep track of for map management. Note that if keys are duplicated the
    // value set last will be used (thus achieving the uniqueness of sets).
    return {
      ...geounitData,
      [geoLevelId]: new Map(
        features
          .filter(feature => feature.sourceLayer === geoLevelId)
          .map((feature: MapboxGeoJSONFeature) => [
            feature.id as FeatureId,
            geoLevelHierarchyKeys.reduce((geounitData, key) => {
              const geounitId = feature.properties && feature.properties[key];
              return geounitId !== undefined && geounitId !== null
                ? [geounitId, ...geounitData]
                : geounitData;
            }, [] as readonly number[])
          ])
      )
    };
  }, {});
}

/*
 * Return child geounits (direct descendents-only)
 */
export function getChildGeoUnits(
  geoUnitIndices: GeoUnitIndices,
  staticMetadata: IStaticMetadata,
  staticGeoLevels: UintArrays
) {
  const childGeoLevelIdx = staticMetadata.geoLevelHierarchy.length - geoUnitIndices.length - 1;
  const childGeoLevel = staticMetadata.geoLevelHierarchy[childGeoLevelIdx];
  if (!childGeoLevel) {
    return {
      childGeoLevel,
      childGeoUnitIds: [],
      childGeoUnits: {}
    };
  } else {
    const geoUnitIdx = geoUnitIndices[0];
    const childGeoUnitIds = getAllIndices(staticGeoLevels[childGeoLevelIdx], new Set([geoUnitIdx]));
    const childGeoUnits = {
      [childGeoLevel.id]: new Map(
        childGeoUnitIds.map((id, index) => [id, [...geoUnitIndices, index]])
      )
    };
    return { childGeoLevel, childGeoUnitIds, childGeoUnits };
  }
}

export function onlyUnlockedGeoUnits(
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts,
  geoUnits: GeoUnits,
  staticMetadata: IStaticMetadata,
  staticGeoLevels: UintArrays
): GeoUnits {
  const unlockedGeoUnits = cloneDeep(geoUnits) as MutableGeoUnits;
  removeLockedGeoUnits(
    districtsDefinition,
    lockedDistricts,
    unlockedGeoUnits,
    staticMetadata,
    staticGeoLevels
  );
  return unlockedGeoUnits;
}

/*
 * Recursively remove locked geounits in-place, adding any unlocked children along the way.
 */
export function removeLockedGeoUnits(
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts,
  geoUnits: MutableGeoUnits,
  staticMetadata: IStaticMetadata,
  staticGeoLevels: UintArrays
) {
  Object.entries(geoUnits).forEach(([geoLevel, geoUnitsForLevel]) => {
    geoUnitsForLevel.forEach((geoUnitIndices, featureId) => {
      // eslint-disable-next-line
      if (isGeoUnitLocked(districtsDefinition, lockedDistricts, geoUnitIndices)) {
        // Remove locked geounit
        // eslint-disable-next-line
        geoUnits[geoLevel].delete(featureId);
        // eslint-disable-next-line
        if (geoUnitIndices.length < staticMetadata.geoLevelHierarchy.length - 1) {
          // This geounit's children are not base geounits, so they may be selected.
          // Add any unlocked sub-geounits to allow for partial selection.
          const { childGeoLevel, childGeoUnits } = getChildGeoUnits(
            geoUnitIndices,
            staticMetadata,
            staticGeoLevels
          );
          childGeoUnits[childGeoLevel.id].forEach((childGeoUnitIndices, childFeatureId) => {
            geoUnits[childGeoLevel.id].set(childFeatureId, childGeoUnitIndices);
          });
          removeLockedGeoUnits(
            districtsDefinition,
            lockedDistricts,
            geoUnits,
            staticMetadata,
            staticGeoLevels
          );
        }
      }
    });
  });
}

export function featuresToUnlockedGeoUnits(
  features: readonly MapboxGeoJSONFeature[],
  staticMetadata: IStaticMetadata,
  districtsDefinition: DistrictsDefinition,
  lockedDistricts: LockedDistricts,
  staticGeoLevels: UintArrays
): GeoUnits {
  return onlyUnlockedGeoUnits(
    districtsDefinition,
    lockedDistricts,
    featuresToGeoUnits(features, staticMetadata.geoLevelHierarchy),
    staticMetadata,
    staticGeoLevels
  );
}
