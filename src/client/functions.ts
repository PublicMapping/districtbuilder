import { toast } from "react-toastify";
import { cloneDeep } from "lodash";

import {
  DistrictsDefinition,
  MutableGeoUnitCollection,
  GeoLevelHierarchy,
  GeoUnits,
  GeoUnitIndices,
  GeoUnitHierarchy,
  NestedArray,
  IProject
} from "../shared/entities";
import { Resource } from "./resource";
import { DistrictsGeoJSON } from "./types";
import { isThisYear, isToday } from "date-fns";
import format from "date-fns/format";

export function areAnyGeoUnitsSelected(geoUnits: GeoUnits) {
  return Object.values(geoUnits).some(geoUnitsForLevel => geoUnitsForLevel.size);
}

// Determines if we are in a scenario where all geolevels have the same minimum zoom,
// and thus, the base geolevel doesn't require special handling
export function isBaseGeoLevelAlwaysVisible(geoLevelHierarchy: GeoLevelHierarchy) {
  return new Set(geoLevelHierarchy.map(level => level.minZoom)).size === 1;
}

export function allGeoUnitIndices(geoUnits: GeoUnits) {
  return Object.values(geoUnits).flatMap(geoUnitForLevel => Array.from(geoUnitForLevel.values()));
}

export function allGeoUnitIds(geoUnits: GeoUnits) {
  return Object.values(geoUnits).flatMap(geoUnitForLevel => Array.from(geoUnitForLevel.keys()));
}

export const capitalizeFirstLetter = (s: string) =>
  s.substring(0, 1).toUpperCase() + s.substring(1);

export const getPartyColor = (party: string) =>
  party === "republican" ? "#BF4E6A" : party === "democrat" ? "#4E56BF" : "#F7AD00";

/*
 * Assign nested geounit to district.
 *
 * This can require the creation of intermediate levels using the current
 * district id as we recurse more deeply.
 */
function assignNestedGeounit(
  currentDistrictsDefinition: MutableGeoUnitCollection,
  currentGeounitData: readonly number[],
  currentGeoUnitHierarchy: GeoUnitHierarchy,
  districtId: number
): MutableGeoUnitCollection {
  const [currentLevelGeounitId, ...remainingLevelsGeounitIds] = currentGeounitData;
  // Update districts definition using existing values or explode out district id using hierarchy
  // eslint-disable-next-line
  let newDefinition: MutableGeoUnitCollection =
    typeof currentDistrictsDefinition === "number"
      ? // Auto-fill district ids using current value based on number of geounits at this level
        new Array(currentGeoUnitHierarchy.length).fill(currentDistrictsDefinition)
      : // Copy existing district ids at this level
        currentDistrictsDefinition;
  /* eslint-disable */
  if (remainingLevelsGeounitIds.length) {
    // We need to go deeper...
    newDefinition[currentLevelGeounitId] = assignNestedGeounit(
      newDefinition[currentLevelGeounitId] as MutableGeoUnitCollection,
      currentGeounitData.slice(1),
      currentGeoUnitHierarchy[currentLevelGeounitId] as readonly number[],
      districtId
    );
  } else {
    // End of the line. Update value with new district id
    newDefinition[currentLevelGeounitId] = districtId;
    if (newDefinition.every(value => value === districtId)) {
      // Update district definition for this level to be just the district id
      // eg. instead of [3, 3, 3, 3, ...] for every geounit at this level, just 3
      newDefinition = districtId;
    }
  }
  /* eslint-enable */
  return newDefinition;
}

/*
 * Return new districts definition after assigning the selected geounits to the current district
 */
export function assignGeounitsToDistrict(
  districtsDefinition: DistrictsDefinition,
  geoUnitHierarchy: GeoUnitHierarchy,
  geounitIndices: readonly GeoUnitIndices[],
  districtId: number
): DistrictsDefinition {
  const districtsDefinitionCopy = cloneDeep(districtsDefinition);
  return geounitIndices.reduce((newDistrictsDefinition, geounitData) => {
    const initialGeounitId = geounitData[0];
    // eslint-disable-next-line
    newDistrictsDefinition[initialGeounitId] =
      geounitData.length === 1
        ? // Assign entire county
          districtId
        : // Need to assign nested geounit
          assignNestedGeounit(
            newDistrictsDefinition[initialGeounitId],
            geounitData.slice(1),
            geoUnitHierarchy[initialGeounitId] as NestedArray<number>,
            districtId
          );
    return newDistrictsDefinition;
  }, districtsDefinitionCopy);
}

// The target population is based on the average population of all districts,
// not including the unassigned district, so we use the number of districts,
// rather than the district feature count (which includes the unassigned district)
export function getTargetPopulation(geojson: DistrictsGeoJSON, project: IProject) {
  return (
    geojson.features.reduce(
      (population, feature) => population + feature.properties.demographics.population,
      0
    ) / project.numberOfDistricts
  );
}

/*
 * Helper function to get exhaustiveness checking.
 *
 * See: https://www.typescriptlang.org/docs/handbook/advanced-types.html#exhaustiveness-checking
 */
export function assertNever(x: never): never {
  // eslint-disable-next-line
  throw new Error(`Unexpected: ${x}`);
}

export const geoLevelLabel = (id: string): string => {
  switch (id) {
    case "county":
      return "Counties";
    default:
      return id[0].toUpperCase() + id.slice(1) + "s";
  }
};

export const geoLevelLabelSingular = (id: string): string => {
  switch (id) {
    case "county":
      return "County";
    default:
      return id[0].toUpperCase() + id.slice(1);
  }
};

export function getSelectedGeoLevel(geoLevelHierarchy: GeoLevelHierarchy, geoLevelIndex: number) {
  return geoLevelHierarchy[geoLevelHierarchy.length - 1 - geoLevelIndex];
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function destructureResource<T extends object>(
  resourceT: Resource<T>,
  key: keyof T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | undefined {
  return "resource" in resourceT ? resourceT.resource[key] : undefined;
}

export function mergeGeoUnits(a: GeoUnits, b: GeoUnits): GeoUnits {
  const geoLevels = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return Object.fromEntries(
    geoLevels.map(geoLevelId => {
      return [geoLevelId, new Map([...(a[geoLevelId] || []), ...(b[geoLevelId] || [])])];
    })
  );
}

export const showActionFailedToast = () => toast.error("Something went wrong, please try again.");
export const showResourceFailedToast = () =>
  toast.error("Something went wrong, please refresh the page.");
export const showMapActionToast = (mapAction: string) =>
  toast.info(mapAction);

export const formatDate = (date: Date): string => {
  const d = new Date(date);
  return date
    ? isToday(d)
      ? format(d, "h:mm a")
      : isThisYear(d)
      ? format(d, "MMM d")
      : format(d, "MMM d yyyy")
    : "—";
};
