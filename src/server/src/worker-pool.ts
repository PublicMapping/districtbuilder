import { Logger } from "@nestjs/common";
import { readFileSync } from "fs";
import _ from "lodash";
import os from "os";
import { spawn, Pool, Worker } from "threads";
import { TaskRunFunction } from "threads/dist/master/pool-types";
import {
  IStaticMetadata,
  IRegionConfig,
  DistrictsDefinition,
  TopologyProperties
} from "../../shared/entities";
import { NUM_WORKERS } from "./common/constants";
import { DistrictsGeoJSON } from "./projects/entities/project.entity";
import { Functions, MergeArgs, TopologyMetadata } from "./worker";

// Timeout after which we kill/recreate the worker pool
const TASK_TIMEOUT_MS = 90_000;

// Reserve 60-80% of memory for responding to requests and loading uncached topology data from disk
// Remaining amount is split amongst each worker for topology data
// This strategy seems to work for both 32Gb and 64Gb instances and targets total memory
// in use stabiliing at around 80%
const dockerMemLimit = Number(
  readFileSync("/sys/fs/cgroup/memory/memory.limit_in_bytes", { encoding: "ascii" })
);
const hostmem = os.totalmem();
const totalmem = Math.min(hostmem, dockerMemLimit);
const reservedMem = totalmem > 32 * 1024 * 1024 * 1024 ? totalmem * 0.6 : totalmem * 0.8;
const maxCacheSize = Math.ceil((totalmem - reservedMem) / NUM_WORKERS);

const logger = new Logger("worker-pool");

// Need to retain access to the workers for each pool to catch errors if they crash
const workers = [...Array(NUM_WORKERS)].map(() => spawn<Functions>(new Worker("./worker")));
const timeouts: Array<NodeJS.Timeout | undefined> = [...Array(NUM_WORKERS)].fill(undefined);

// Track region size & pool size so we can kill/recreate workers when they exceed a maximum size
const poolSizes = [...Array(NUM_WORKERS)].map(() => 0);
const regionSizes: { [key: string]: number } = {};

// We need to terminate pools cleanly when running the test suite
export async function terminatePool() {
  return Promise.all(workerPools.map(pool => pool.terminate()));
}

// The ability to queue tasks is nice, but we want to explicitly route to worker threads that already have data loaded
// To do so, we create many pools (each of which can queue tasks) with one worker each, rather than one pool with many workers
const workerPools = workers.map((worker, i) =>
  Pool(() => Promise.resolve(worker), { size: 1, name: `worker-${i}` })
);
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type WorkerThread = Awaited<typeof workers[0]>;
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
let poolsByRegion: { [id: string]: number[] } = {};
let roundRobinIndex = 0;
const incrementedIndex = () => (roundRobinIndex = (roundRobinIndex + 1) % NUM_WORKERS);

async function findPool(
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata
): Promise<number> {
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

  // If this region wasn't already in this pool, update the worker size
  // This may trigger recreating the worker thread if we would exceed the max size
  if (!poolsByRegion[regionConfig.id] || !poolsByRegion[regionConfig.id].includes(poolToUse)) {
    const size = await getRegionSize(regionConfig, staticMetadata, poolToUse);
    if (poolSizes[poolToUse] + size > maxCacheSize) {
      await recreatePool(poolToUse);
      // eslint-disable-next-line functional/immutable-data
      poolSizes[poolToUse] = 0;
      poolsByRegion = _.mapValues(poolsByRegion, pools => pools.filter(p => p !== poolToUse));
    }
    // eslint-disable-next-line functional/immutable-data
    poolSizes[poolToUse] += size;
  }
  // Move this pool to the top of the list of pools for this region
  // eslint-disable-next-line functional/immutable-data
  poolsByRegion[regionConfig.id] = [poolToUse, ...lastUsed.filter(pool => pool != poolToUse)];

  return poolToUse;
}

async function getRegionSize(
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata,
  pool: number
): Promise<number> {
  if (regionConfig.id in regionSizes) {
    return regionSizes[regionConfig.id];
  }

  const { sizeInBytes }: TopologyMetadata = await workerPools[pool].queue(worker =>
    worker.getTopologyMetadata(regionConfig, staticMetadata)
  );
  // eslint-disable-next-line functional/immutable-data
  regionSizes[regionConfig.id] = sizeInBytes;
  return sizeInBytes;
}

// If a worker times out or errors, or reaches its max cache size, replace it & its pool
function recreatePool(i: number): Promise<void> {
  void workerPools[i].terminate(true);
  return spawn<Functions>(new Worker("./worker"))
    .then(newWorker => {
      const newPromise = Promise.resolve(newWorker);
      // eslint-disable-next-line functional/immutable-data
      workers[i] = newPromise;
      // eslint-disable-next-line functional/immutable-data
      workerPools[i] = Pool(() => newPromise, { size: 1, name: `worker-${i}` });
      logger.log(`Recreated worker ${i}`);
    })
    .catch(() => {
      logger.error(`Failed to recreated worker ${i}`);
    });
}

function clearPoolTimeout(poolIndex: number) {
  // Clear the timeout so we don't run the cleanup function
  const timeout = timeouts[poolIndex];
  timeout && clearTimeout(timeout);
  // eslint-disable-next-line functional/immutable-data
  timeouts[poolIndex] = undefined;
}

function queueWithTimeout<R>(poolIndex: number, cb: TaskRunFunction<WorkerThread, R>) {
  const task = workerPools[poolIndex].queue(cb);
  // Clear out any timeouts after the task completes
  task.then(() => clearPoolTimeout(poolIndex)).catch(() => recreatePool(poolIndex));
  // Also clear pre-existing timeouts if we're adding a new one before cleanup could happen
  clearPoolTimeout(poolIndex);
  // eslint-disable-next-line functional/immutable-data
  timeouts[poolIndex] = setTimeout(() => void recreatePool(poolIndex), TASK_TIMEOUT_MS);
  return task;
}

export const merge = (args: MergeArgs) =>
  findPool(args.regionConfig, args.staticMetadata).then<DistrictsGeoJSON>(pool =>
    queueWithTimeout(pool, worker => worker.merge(args))
  );

export const importFromCSV = (
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  blockToDistricts: {
    readonly [block: string]: number;
  }
) =>
  findPool(regionConfig, staticMetadata).then<DistrictsDefinition>(pool =>
    queueWithTimeout(pool, worker =>
      worker.importFromCSV(staticMetadata, regionConfig, blockToDistricts)
    )
  );

export const exportToCSV = (
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  districtsDefinition: DistrictsDefinition
) =>
  findPool(regionConfig, staticMetadata).then<[string, number][]>(pool =>
    queueWithTimeout(pool, worker =>
      worker.exportToCSV(staticMetadata, regionConfig, districtsDefinition)
    )
  );

export const getTopologyProperties = (
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata
) =>
  findPool(regionConfig, staticMetadata).then<TopologyProperties>(pool =>
    queueWithTimeout(pool, worker => worker.getTopologyProperties(regionConfig, staticMetadata))
  );
