import {
  DemographicCounts,
  DistrictsDefinition,
  GeoUnits,
  GeoUnitIndices,
  GeoUnitHierarchy,
  IProject,
  IStaticMetadata,
  NestedArray,
  S3URI
} from "../shared/entities";
import { getDemographics as getDemographicsBase } from "../shared/functions";
import { allGeoUnitIndices } from "./functions";
import { fetchWorkerStaticData } from "./s3";
import { WorkerProjectData } from "./types";

interface RegionData {
  readonly uri: S3URI;
  readonly data: Promise<WorkerProjectData>;
}

// eslint-disable-next-line
let regionData: RegionData | undefined;

function fetchRegionData(regionURI: S3URI, staticMetadata: IStaticMetadata): RegionData {
  // eslint-disable-next-line
  if (!regionData || regionData.uri !== regionURI) {
    regionData = {
      uri: regionURI,
      data: fetchWorkerStaticData(regionURI, staticMetadata)
    };
  }
  return regionData;
}

async function getDemographics(
  baseIndices: readonly number[] | ReadonlySet<number>,
  staticMetadata: IStaticMetadata,
  regionURI: S3URI
): Promise<DemographicCounts> {
  const data = await fetchRegionData(regionURI, staticMetadata).data;
  return getDemographicsBase(baseIndices, staticMetadata, data.staticDemographics);
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

export async function getTotalSelectedDemographics(
  staticMetadata: IStaticMetadata,
  regionURI: S3URI,
  selectedGeounits: GeoUnits
): Promise<DemographicCounts> {
  const data = await fetchRegionData(regionURI, staticMetadata).data;
  // Build up set of blocks ids corresponding to selected geounits
  // eslint-disable-next-line
  const selectedBaseIndices: Set<number> = new Set();
  allGeoUnitIndices(selectedGeounits).forEach(geoUnitIndices =>
    baseIndicesForGeoUnit(data.geoUnitHierarchy, geoUnitIndices).forEach(index =>
      // eslint-disable-next-line
      selectedBaseIndices.add(index)
    )
  );
  // Aggregate all counts for selected blocks
  return getDemographics(selectedBaseIndices, staticMetadata, regionURI);
}

// Drill into the district definition and collect the base geounits for
// every district that's part of the selection
export async function getSavedDistrictSelectedDemographics(
  project: IProject,
  staticMetadata: IStaticMetadata,
  regionURI: S3URI,
  selectedGeounits: GeoUnits
): Promise<readonly DemographicCounts[]> {
  const data = await fetchRegionData(regionURI, staticMetadata).data;
  /* eslint-disable */
  // Note: not using Array.fill to populate these, because the empty array in memory gets shared
  const mutableDistrictGeounitAccum: number[][] = [];
  for (let i = 0; i <= project.numberOfDistricts; i = i + 1) {
    mutableDistrictGeounitAccum[i] = [];
  }
  /* eslint-enable */

  // Collect all base geounits found in the selection
  const accumulateGeounits = (
    subIndices: GeoUnitIndices,
    subDefinition: DistrictsDefinition | number,
    subHierarchy: GeoUnitHierarchy | number
  ) => {
    if (typeof subHierarchy === "number" && typeof subDefinition === "number") {
      // The base case: we made it to the bottom of the trees and need to assign this
      // base geonunit to the district found in the district definition
      // eslint-disable-next-line
      mutableDistrictGeounitAccum[subDefinition].push(subHierarchy);
      return;
    } else if (subIndices.length === 0 && typeof subHierarchy !== "number") {
      // We've exhausted the base indices. This means we ned to grab all the indices found
      // at this level and accumulate them all
      subHierarchy.forEach((_, ind) => accumulateGeounits([ind], subDefinition, subHierarchy));
      return;
    } else {
      // Recurse by drilling into all three data structures:
      // geounit indices, district definition, and geounit hierarchy
      const currIndex = subIndices[0];
      const currDefn =
        typeof subDefinition === "number"
          ? subDefinition
          : (subDefinition[currIndex] as DistrictsDefinition);
      const currHierarchy =
        typeof subHierarchy === "number" ? subHierarchy : subHierarchy[currIndex];
      accumulateGeounits(subIndices.slice(1), currDefn, currHierarchy);
      return;
    }
  };

  allGeoUnitIndices(selectedGeounits).forEach(geoUnitIndices => {
    accumulateGeounits(geoUnitIndices, project.districtsDefinition, data.geoUnitHierarchy);
  });

  return Promise.all(
    mutableDistrictGeounitAccum.map(baseGeounitIdsForDistrict =>
      getDemographics(baseGeounitIdsForDistrict, staticMetadata, project.regionConfig.s3URI)
    )
  );
}
