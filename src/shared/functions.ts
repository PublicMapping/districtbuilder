import { MapboxGeoJSONFeature } from "mapbox-gl";
import { zip } from "lodash";
import {
  DistrictsDefinition,
  GeoLevelInfo,
  GeoUnitData,
  GeoUnitHierarchy,
  IStaticMetadata
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
  districtId: number,
  geoLevelIndex: number
): DistrictsDefinition {
  console.log("districtsDefinition", districtsDefinition);
  console.log("geoUnitHierarchy", geoUnitHierarchy);
  console.log("geounitIds", geounitDataSet);
  console.log("districtId", districtId);
  console.log("sub-geounits", zip(geoUnitHierarchy)[geoLevelIndex]);
  debugger;
  return [...geounitDataSet].reduce((newDistrictsDefinition, geounitData) => {
    const geounitId = geounitData[geoLevelIndex];
    if (typeof newDistrictsDefinition[geounitId] === "number") {
      // @ts-ignore
      // eslint-disable-next-line
      newDistrictsDefinition[geounitId] = districtId;
      return newDistrictsDefinition;
    } else {
      // newDistrictsDefinition[geounitId] = assignGeounitsToDistrict(
      return newDistrictsDefinition; //assignGeounitsToDistrict(newDistrictsDefinition,
    }
  }, districtsDefinition);
}

export function featuresToSet(
  features: readonly MapboxGeoJSONFeature[],
  geoLevelHierarchy: readonly GeoLevelInfo[]
): ReadonlySet<GeoUnitData> {
  const geoLevelHierarchyKeys = geoLevelHierarchy.map(geoLevel => `${geoLevel.id}Idx`);
  return new Set(
    features.map((feature: MapboxGeoJSONFeature) =>
      geoLevelHierarchyKeys.reduce(
        (geounitData, key) => {
          const geounitId = feature.properties && feature.properties[key];
          return geounitId !== undefined && geounitId !== null
            ? [...geounitData, geounitId]
            : geounitData;
        },
        [feature.id] as number[]
      )
    )
  );
}
