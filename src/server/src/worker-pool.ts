import _ from "lodash";
import { spawn, Pool, Worker } from "threads";
import {
  IStaticMetadata,
  IRegionConfig,
  DistrictsDefinition,
  TopologyProperties
} from "../../shared/entities";
import { NUM_WORKERS } from "./common/constants";
import { DistrictsGeoJSON } from "./projects/entities/project.entity";
import { Functions, MergeArgs } from "./worker";

// The ability to queue tasks is nice, but we want to explicitly route to worker threads that already have data loaded
// To do so, we create many pools (each of which can queue tasks) with one worker each, rather than one pool with many workers
const workerPools = [...Array(NUM_WORKERS).keys()].map(i =>
  Pool(() => spawn<Functions>(new Worker("./worker")), { size: 1, name: `worker-${i}` })
);
type WorkerPool = typeof workerPools[0];

// This is needed by the tests
export async function terminatePool() {
  return Promise.all(workerPools.map(pool => pool.terminate()));
}

async function getSettledPools(workerPools: WorkerPool[]) {
  return [
    ...(await Promise.all(
      workerPools.map(pool =>
        Promise.race([
          pool.settled(true).then(() => {
            return [true, pool] as [boolean, WorkerPool];
          }),
          new Promise<[boolean, WorkerPool]>(res => setTimeout(() => res([false, pool]), 1))
        ])
      )
    ))
  ].flatMap(([settled, pool]: [boolean, unknown]) => {
    return settled ? [pool] : [];
  }) as WorkerPool[];
}

// Keep track of which regions have been routed to which pools, in order of recency
// We'll try to reroute back to those same pools later to re-use the workers cached data
const poolsByRegion: { [id: string]: WorkerPool[] } = {};

async function findPool(regionConfig: IRegionConfig): Promise<WorkerPool> {
  const lastUsed = poolsByRegion[regionConfig.id] || [];
  const lastUsedSettled = await getSettledPools(lastUsed);
  const allSettledPools = await getSettledPools(workerPools);

  const poolToUse =
    // First check for available pools that were used for this region, get most recent
    lastUsedSettled.length > 0
      ? lastUsedSettled[0]
      : // Next check if any pools are available
      allSettledPools.length > 0
      ? (_.sample(allSettledPools) as WorkerPool)
      : // If we have no available pools, use the most recent for this region
      lastUsed.length > 0
      ? lastUsed[0]
      : // Lastly, just use anything
        (_.sample(workerPools) as WorkerPool);

  // Move this pool to the top of the list of pools for this region
  // eslint-disable-next-line functional/immutable-data
  poolsByRegion[regionConfig.id] = [poolToUse, ...lastUsed.filter(pool => pool != poolToUse)];

  return poolToUse;
}

export const merge = (args: MergeArgs) =>
  findPool(args.regionConfig).then<DistrictsGeoJSON>(pool =>
    pool.queue(worker => worker.merge(args))
  );

export const importFromCSV = (
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  blockToDistricts: {
    readonly [block: string]: number;
  }
) =>
  findPool(regionConfig).then<DistrictsDefinition>(pool =>
    pool.queue(worker => worker.importFromCSV(staticMetadata, regionConfig, blockToDistricts))
  );

export const exportToCSV = (
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  districtsDefinition: DistrictsDefinition
) =>
  findPool(regionConfig).then<[string, number][]>(pool =>
    pool.queue(worker => worker.exportToCSV(staticMetadata, regionConfig, districtsDefinition))
  );

export const getTopologyProperties = (
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata
) =>
  findPool(regionConfig).then<TopologyProperties>(pool =>
    pool.queue(worker => worker.getTopologyProperties(regionConfig, staticMetadata))
  );

export const cacheRegion = (regionConfig: IRegionConfig, staticMetadata: IStaticMetadata) =>
  findPool(regionConfig).then(pool =>
    pool.queue(worker => worker.cacheRegion(regionConfig, staticMetadata))
  );
