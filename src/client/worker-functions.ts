import { DemographicCounts, GeoUnits, IProject, IStaticMetadata, S3URI } from "../shared/entities";
/* eslint import/no-webpack-loader-syntax: off */
import createWorker from "workerize-loader!./worker";
import * as WorkerType from "./worker";

const worker = createWorker<typeof WorkerType>();

export async function getDemographics(
  baseIndices: readonly number[] | ReadonlySet<number>,
  staticMetadata: IStaticMetadata,
  regionURI: S3URI
): Promise<DemographicCounts> {
  return worker.getDemographics(baseIndices, staticMetadata, regionURI);
}

export async function getTotalSelectedDemographics(
  staticMetadata: IStaticMetadata,
  regionURI: S3URI,
  selectedGeounits: GeoUnits
): Promise<DemographicCounts> {
  return worker.getTotalSelectedDemographics(staticMetadata, regionURI, selectedGeounits);
}

export async function getSavedDistrictSelectedDemographics(
  project: IProject,
  staticMetadata: IStaticMetadata,
  selectedGeounits: GeoUnits
): Promise<readonly DemographicCounts[]> {
  return worker.getSavedDistrictSelectedDemographics(
    project,
    staticMetadata,
    project.regionConfig.s3URI,
    selectedGeounits
  );
}
