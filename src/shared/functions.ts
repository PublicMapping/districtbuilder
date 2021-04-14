import { UintArray, DemographicCounts, IStaticMetadata } from "../shared/entities";

// Helper for finding all indices in an array buffer matching a value.
// Note: mutation is used, because the union type of array buffers proved
// too difficult to line up types for reduce or map/filter.
export function getAllIndices(arrayBuf: UintArray, vals: ReadonlySet<number>): readonly number[] {
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

// Recursively finds all base indices matching a set of values at a specified level
export function getAllBaseIndices(
  descGeoLevels: readonly UintArray[],
  levelIndex: number,
  vals: readonly number[]
): readonly number[] {
  // eslint-disable-next-line
  if (vals.length === 0 || levelIndex === descGeoLevels.length) {
    return vals;
  }
  return getAllBaseIndices(
    descGeoLevels,
    levelIndex + 1,
    getAllIndices(descGeoLevels[levelIndex], new Set(vals))
  );
}

export function getDemographics(
  baseIndices: readonly number[] | ReadonlySet<number>,
  staticMetadata: IStaticMetadata,
  staticDemographics: readonly UintArray[]
): DemographicCounts {
  // Aggregate demographic data for the IDs
  return staticMetadata.demographics.reduce((data, demographic, ind) => {
    let count: number = 0; // eslint-disable-line
    baseIndices.forEach((v: number) => {
      if (!isNaN(staticDemographics[ind][v])) {
        count += staticDemographics[ind][v];
      }
    });
    return { ...data, [demographic.id]: count };
  }, {} as DemographicCounts);
}
