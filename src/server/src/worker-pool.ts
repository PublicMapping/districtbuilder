import { Logger } from "@nestjs/common";
import { spawn, Pool, Worker, Thread } from "threads";
import {
  IStaticMetadata,
  IRegionConfig,
  DistrictsDefinition,
  TopologyProperties
} from "../../shared/entities";
import { NUM_WORKERS } from "./common/constants";
import { DistrictsGeoJSON } from "./projects/entities/project.entity";
import { Functions, MergeArgs } from "./worker";

const logger = new Logger("worker-pool");

// Need to retain access to the workers for each pool to catch errors if they crash
const workers = [...Array(NUM_WORKERS)].map(() => spawn<Functions>(new Worker("./worker")));

// This function is needed by the tests
let terminating = false;
export async function terminatePool() {
  terminating = true;
  return Promise.all(workerPools.map(pool => pool.terminate()));
}

// If a worker crashes (e.g. it ran out of memory), replace it & its pool
function recreatePoolOnExit(promise: Promise<Thread>, i: number) {
  void promise.then(worker => {
    Thread.events(worker).subscribe(event => {
      if (terminating || event.type === "message") return;

      spawn<Functions>(new Worker("./worker"))
        .then(newWorker => {
          const newPromise = Promise.resolve(newWorker);
          // eslint-disable-next-line functional/immutable-data
          workers[i] = newPromise;
          // eslint-disable-next-line functional/immutable-data
          workerPools[i] = Pool(() => newPromise, { size: 1, name: `worker-${i}` });
          // Setup crash handler for new worker
          logger.log("Recreated worker ${i} after crash");
          recreatePoolOnExit(newPromise, i);
        })
        .catch(() => {
          logger.error("Failed to recreated worker ${i} after crash");
        });
    });
  });
}
workers.forEach(recreatePoolOnExit);

// The ability to queue tasks is nice, but we want to explicitly route to worker threads that already have data loaded
// To do so, we create many pools (each of which can queue tasks) with one worker each, rather than one pool with many workers
const workerPools = workers.map((worker, i) =>
  Pool(() => Promise.resolve(worker), { size: 1, name: `worker-${i}` })
);
type WorkerPool = typeof workerPools[0];

// Not that important to limit small regions, but large regions in every worker will eat up our cache
const MAX_PER_REGION = Math.ceil(NUM_WORKERS / 2);

async function getSettledPools(workerPools: WorkerPool[], indexes: number[]) {
  return [
    ...(await Promise.all(
      indexes.map(index => {
        return Promise.race([
          workerPools[index].settled(true).then(() => {
            return [true, index] as [boolean, number];
          }),
          new Promise<[boolean, number]>(res => setTimeout(() => res([false, index]), 1))
        ]);
      })
    ))
  ].flatMap(([settled, poolIndex]: [boolean, number]) => {
    return settled ? [poolIndex] : [];
  });
}

// Keep track of which regions have been routed to which pools, in order of recency
// We'll try to reroute back to those same pools later to re-use the workers cached data
const poolsByRegion: { [id: string]: number[] } = {};
let roundRobinIndex = 0;
const incrementedIndex = () => (roundRobinIndex = (roundRobinIndex + 1) % NUM_WORKERS);

async function findPool(regionConfig: IRegionConfig): Promise<WorkerPool> {
  const lastUsed = poolsByRegion[regionConfig.id] || [];
  const lastUsedSettled = await getSettledPools(workerPools, lastUsed);
  const allSettledPools = await getSettledPools(workerPools, [...workerPools.keys()]);

  const getNextSettled = (): number =>
    allSettledPools.includes(incrementedIndex()) ? roundRobinIndex : getNextSettled();

  const poolToUse: number =
    // First check for available pools that were used for this region, get most recent
    lastUsedSettled.length > 0
      ? lastUsedSettled[0]
      : // Next check if any pools are available, if we haven't hit our limit for this region
      lastUsed.length < MAX_PER_REGION && allSettledPools.length > 0
      ? // Choose our next round-robin index if it's settled, or skip to the next one after that
        getNextSettled()
      : // If we have no available pools, use the most recent for this region
      lastUsed.length > 0
      ? lastUsed[0]
      : // Lastly, just use anything, choosing pools round-robin
        incrementedIndex();

  // Move this pool to the top of the list of pools for this region
  // eslint-disable-next-line functional/immutable-data
  poolsByRegion[regionConfig.id] = [poolToUse, ...lastUsed.filter(pool => pool != poolToUse)];

  return workerPools[poolToUse];
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
