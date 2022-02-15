import { spawn, Pool, Worker } from "threads";
import { IStaticMetadata, IRegionConfig, DistrictsDefinition } from "../../shared/entities";
import { Functions, MergeArgs } from "./worker";

const workerPool = Pool(() => spawn<Functions>(new Worker("./worker")));

// This is needed by the tests
export async function terminatePool() {
  return workerPool.terminate();
}

export const merge = (args: MergeArgs) => workerPool.queue(worker => worker.merge(args));

export const importFromCSV = (
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  blockToDistricts: {
    readonly [block: string]: number;
  }
) =>
  workerPool.queue(worker => worker.importFromCSV(staticMetadata, regionConfig, blockToDistricts));

export const exportToCSV = (
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  districtsDefinition: DistrictsDefinition
) =>
  workerPool.queue(worker => worker.exportToCSV(staticMetadata, regionConfig, districtsDefinition));

export const getTopologyProperties = (regionConfig: IRegionConfig) =>
  workerPool.queue(worker => worker.getTopologyProperties(regionConfig));
