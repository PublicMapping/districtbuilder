import {
  DistrictsDefinition,
  GeoUnitCollection,
  GeoUnitIndices,
  GeoUnitHierarchy,
  IStaticMetadata,
  NestedArray
} from "../shared/entities";

type ArrayBuffer = Uint8Array | Uint16Array | Uint32Array;

// Helper for finding all indices in an array buffer matching a value.
// Note: mutation is used, because the union type of array buffers proved
// too difficult to line up types for reduce or map/filter.
export function getAllIndices(arrayBuf: ArrayBuffer, vals: ReadonlySet<number>): readonly number[] {
  // eslint-disable-next-line
  let indices: number[] = [];
  arrayBuf.forEach((el: number, ind: number) => {
    // eslint-disable-next-line
    if (vals.has(el)) {
      // eslint-disable-next-line
      indices.push(ind);
    }
  });
  return indices;
}

export function getDemographics(
  baseIndices: readonly number[],
  staticMetadata: IStaticMetadata,
  staticDemographics: readonly ArrayBuffer[]
): { readonly [id: string]: number } {
  // Aggregate demographic data for the IDs
  return staticMetadata.demographics.reduce(
    (data, demographic, ind) => {
      const val = baseIndices.reduce(
        (sum, v) => (isNaN(staticDemographics[ind][v]) ? sum : sum + staticDemographics[ind][v]),
        0
      );
      // eslint-disable-next-line
      data[demographic.id] = val;
      return data;
    },
    // eslint-disable-next-line
    {} as { [id: string]: number }
  );
}

function assignGeounit(
  currentDistrictsDefinition: GeoUnitCollection,
  currentGeounitData: number[],
  currentGeoUnitHierarchy: GeoUnitHierarchy,
  districtId: number
): GeoUnitCollection {
  const [currentLevelGeounitId, ...remainingLevelsGeounitIds] = currentGeounitData;
  // Update districts definition using existing values or explode out district id using hierarchy
  let newDefinition =
    typeof currentDistrictsDefinition !== "number"
      ? // Copy existing district ids at this level
        currentDistrictsDefinition
      : // Auto-fill district ids using current value based on number of geounits at this level
        new Array(currentGeoUnitHierarchy.length).fill(currentDistrictsDefinition);
  if (remainingLevelsGeounitIds.length) {
    // We need to go deeper...
    newDefinition[currentLevelGeounitId] = assignGeounit(
      newDefinition[currentLevelGeounitId],
      currentGeounitData.slice(1),
      currentGeoUnitHierarchy[currentLevelGeounitId] as number[],
      districtId
    );
  } else {
    // End of the line. Update value with new district id
    newDefinition[currentLevelGeounitId] = districtId;
  }
  return newDefinition;
}

/*
 * Return new districts definition after assigning the selected geounit ids to the current district
 */
export function assignGeounitsToDistrict(
  districtsDefinition: DistrictsDefinition,
  geoUnitHierarchy: GeoUnitHierarchy,
  geounitDataSet: ReadonlySet<GeoUnitIndices>,
  districtId: number
): DistrictsDefinition {
  return [...geounitDataSet].reduce((newDistrictsDefinition, geounitData) => {
    const initialGeounitId = geounitData[0];
    if (geounitData.length === 1) {
      // Assign entire county
      // eslint-disable-next-line
      newDistrictsDefinition[initialGeounitId] = districtId;
    } else {
      // eslint-disable-next-line
      newDistrictsDefinition[initialGeounitId] = assignGeounit(
        newDistrictsDefinition[initialGeounitId],
        geounitData.slice(1),
        geoUnitHierarchy[initialGeounitId] as NestedArray<number>,
        districtId
      );
    }
    return newDistrictsDefinition;
  }, districtsDefinition);
}
