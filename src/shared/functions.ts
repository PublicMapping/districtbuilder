import {
  DistrictsDefinition,
  MutableGeoUnitCollection,
  GeoUnits,
  GeoUnitIndices,
  GeoUnitHierarchy,
  IStaticMetadata,
  NestedArray
} from "../shared/entities";

type ArrayBuffer = Uint8Array | Uint16Array | Uint32Array;

// Recursively finds all base indices matching a set of values at a specified level.
// Note: mutation is used, because the union type of array buffers proved
// too difficult to line up types for reduce or map/filter.
export function getAllBaseIndices(
  descGeoLevels: readonly ArrayBuffer[],
  levelIndex: number,
  vals: readonly number[]
): readonly number[] {
  // eslint-disable-next-line
  if (vals.length === 0 || levelIndex === descGeoLevels.length) {
    return vals;
  }

  // eslint-disable-next-line
  let indices: number[] = [];
  const valsSet = new Set(vals);
  descGeoLevels[levelIndex].forEach((el: number, ind: number) => {
    // eslint-disable-next-line
    if (valsSet.has(el)) {
      // eslint-disable-next-line
      indices.push(ind);
    }
  });
  return getAllBaseIndices(descGeoLevels, levelIndex + 1, indices);
}

interface DemographicCounts {
  // key is demographic group (eg. population, white, black, etc)
  // value is the number of people in that group
  [id: string]: number; // eslint-disable-line
}

export function getDemographics(
  baseIndices: number[] | Set<number>, // eslint-disable-line
  staticMetadata: IStaticMetadata,
  staticDemographics: readonly ArrayBuffer[]
): DemographicCounts {
  // Aggregate demographic data for the IDs
  return staticMetadata.demographics.reduce(
    (data, demographic, ind) => {
      let count: number = 0; // eslint-disable-line
      baseIndices.forEach((v: number) => {
        // eslint-disable-next-line
        if (!isNaN(staticDemographics[ind][v])) {
          count += staticDemographics[ind][v];
        }
      });
      // eslint-disable-next-line
      data[demographic.id] = count;
      return data;
    },
    // eslint-disable-next-line
    {} as DemographicCounts
  );
}

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

// Aggregate all demographics that are included in the selection
export function getTotalSelectedDemographics(
  staticMetadata: IStaticMetadata,
  geoUnitHierarchy: GeoUnitHierarchy,
  staticDemographics: ReadonlyArray<Uint8Array | Uint16Array | Uint32Array>,
  selectedGeounits: GeoUnits
): DemographicCounts {
  // Build up set of blocks ids corresponding to selected geounits
  // eslint-disable-next-line
  const selectedBaseIndices: Set<number> = new Set();
  selectedGeounits.forEach(geoUnitIndices =>
    baseIndicesForGeoUnit(geoUnitHierarchy, geoUnitIndices).forEach(index =>
      // eslint-disable-next-line
      selectedBaseIndices.add(index)
    )
  );
  // Aggregate all counts for selected blocks
  return getDemographics(selectedBaseIndices, staticMetadata, staticDemographics);
}

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
  }, districtsDefinition);
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
