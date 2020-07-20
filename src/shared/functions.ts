import {
  DistrictsDefinition,
  GeoLevelInfo,
  GeoUnitCollection,
  GeoUnitData,
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

/*
 * Return new districts definition after assigning the selected geounit ids to the current district
 */
export function assignGeounitsToDistrict(
  districtsDefinition: DistrictsDefinition,
  geoUnitHierarchy: GeoUnitHierarchy,
  geounitDataSet: ReadonlySet<GeoUnitData>,
  districtId: number
): DistrictsDefinition {
  return [...geounitDataSet].reduce((newDistrictsDefinition, geounitData) => {
    // Example geounitData for county selected: [0]
    // Example geounitData for tract selected: [0, 58]
    // Example geounitData for block selected: [0, 58, 1385]
    const assignGeounits = (
      currentDistrictsDefinition: GeoUnitCollection,
      currentGeounitData: number[],
      currentGeoUnitHierarchy: GeoUnitHierarchy
    ): GeoUnitCollection => {
      const [currentLevelGeounitId, ...remainingLevelsGeounitIds] = currentGeounitData;
      if (currentLevelGeounitId === undefined) {
        return currentDistrictsDefinition;
      }
      // Update districts definition using existing values or explode out district id using hierarchy
      const geounitsInHierarchyAtNewLevel = currentGeoUnitHierarchy[
        currentLevelGeounitId
      ] as number[];
      let newDefinition =
        typeof currentDistrictsDefinition !== "number"
          ? // Copy existing district ids at this level
            currentDistrictsDefinition
          : // Auto-fill district ids using current value based on number of geounits at this level
            new Array(geounitsInHierarchyAtNewLevel.length).fill(currentDistrictsDefinition);
      if (remainingLevelsGeounitIds.length) {
        // We need to go deeper...
        assignGeounits(newDefinition, currentGeounitData.slice(1), geounitsInHierarchyAtNewLevel);
      } else {
        // End of the line. Update value with new district id
        newDefinition[currentLevelGeounitId] = districtId;
      }
      return newDefinition;
    };

    const initialGeounitId = geounitData[0];
    if (geounitData.length === 0) {
      // Assign entire county
      // eslint-disable-next-line
      newDistrictsDefinition[initialGeounitId] = districtId;
    } else {
      // eslint-disable-next-line
      newDistrictsDefinition[initialGeounitId] = assignGeounits(
        newDistrictsDefinition[initialGeounitId],
        geounitData,
        geoUnitHierarchy
      );
    }
    return newDistrictsDefinition;
  }, districtsDefinition);
}
