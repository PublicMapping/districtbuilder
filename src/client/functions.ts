import memoize from "memoizee";
import { toast } from "react-toastify";
import { cloneDeep } from "lodash";

import {
  DemographicCounts,
  DistrictsDefinition,
  MutableGeoUnitCollection,
  GeoLevelHierarchy,
  GeoUnits,
  GeoUnitIndices,
  GeoUnitHierarchy,
  IStaticMetadata,
  NestedArray
} from "../shared/entities";
import { Resource } from "./resource";
import { getDemographics as getDemographicsBase } from "../shared/functions";

// TODO: merge this function with shared/functions once the ability to import
// third party dependencies into the shared module is fixed
export const getDemographics = memoize(getDemographicsBase, {
  normalizer: args => JSON.stringify([[...args[0]].sort(), args[1]]),
  primitive: true
});

/*
 * Return all base indices for this subset of the geounit hierarchy.
 */
// eslint-disable-next-line
function accumulateBaseIndices(geoUnitHierarchy: GeoUnitHierarchy): number[] {
  // eslint-disable-next-line
  const baseIndices: number[] = [];
  geoUnitHierarchy.forEach(currentIndices =>
    // eslint-disable-next-line
    baseIndices.push(
      ...(typeof currentIndices === "number"
        ? [currentIndices]
        : accumulateBaseIndices(currentIndices))
    )
  );
  return baseIndices;
}

/*
 * Return all corresponding base indices (i.e. smallest geounit, eg. blocks) for a given geounit.
 */
function baseIndicesForGeoUnit(
  geoUnitHierarchy: GeoUnitHierarchy,
  geoUnitIndices: GeoUnitIndices
  // eslint-disable-next-line
): number[] {
  const [geoUnitIndex, ...remainingGeoUnitIndices] = geoUnitIndices;
  const indicesForGeoLevel: number | NestedArray<number> = geoUnitHierarchy[geoUnitIndex];
  // eslint-disable-next-line
  if (remainingGeoUnitIndices.length) {
    // Need to recurse to find the geounit in question in the hierarchy
    return baseIndicesForGeoUnit(indicesForGeoLevel as GeoUnitHierarchy, remainingGeoUnitIndices);
  }
  // We've reached the geounit we're after. Now we need to return all the base geounit ids below it
  // eslint-disable-next-line
  if (typeof indicesForGeoLevel === "number") {
    // Must be working with base geounit. Wrap it in an array and return.
    return [indicesForGeoLevel];
  }
  return accumulateBaseIndices(indicesForGeoLevel);
}

export function areAnyGeoUnitsSelected(geoUnits: GeoUnits) {
  return Object.values(geoUnits).some(geoUnitsForLevel => geoUnitsForLevel.size);
}

export function allGeoUnitIndices(geoUnits: GeoUnits) {
  return Object.values(geoUnits).flatMap(geoUnitForLevel => Array.from(geoUnitForLevel.values()));
}

export function allGeoUnitIds(geoUnits: GeoUnits) {
  return Object.values(geoUnits).flatMap(geoUnitForLevel => Array.from(geoUnitForLevel.keys()));
}

// Aggregate all demographics that are included in the selection
function getTotalSelectedDemographicsBase(
  staticMetadata: IStaticMetadata,
  geoUnitHierarchy: GeoUnitHierarchy,
  staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  selectedGeounits: GeoUnits
): DemographicCounts {
  // Build up set of blocks ids corresponding to selected geounits
  // eslint-disable-next-line
  const selectedBaseIndices: Set<number> = new Set();
  allGeoUnitIndices(selectedGeounits).forEach(geoUnitIndices =>
    baseIndicesForGeoUnit(geoUnitHierarchy, geoUnitIndices).forEach(index =>
      // eslint-disable-next-line
      selectedBaseIndices.add(index)
    )
  );
  // Aggregate all counts for selected blocks
  return getDemographics(selectedBaseIndices, staticMetadata, staticDemographics);
}

export const getTotalSelectedDemographics = memoize(getTotalSelectedDemographicsBase, {
  normalizer: args => JSON.stringify([args[0], [...allGeoUnitIndices(args[3])].sort()]),
  primitive: true
});

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
    case "block":
      return "Blocks";
    case "tract":
      return "Tracts";
    case "blockgroup":
      return "Blockgroups";
    case "county":
      return "Counties";
    default:
      return id;
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
