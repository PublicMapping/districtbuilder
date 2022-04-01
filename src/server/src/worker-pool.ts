import { Logger } from "@nestjs/common";
import { readFileSync } from "fs";
import _ from "lodash";
import os from "os";
import Queue from "promise-queue";
import { spawn, Worker, Thread } from "threads";
import { TaskRunFunction } from "threads/dist/master/pool-types";
import { IStaticMetadata, IRegionConfig, DistrictsDefinition } from "../../shared/entities";
import { NUM_WORKERS } from "./common/constants";
import { formatBytes } from "./common/functions";
import { Functions, MergeArgs, TopologyMetadata } from "./worker";

// Timeout after which we kill/recreate the worker thread
const TASK_TIMEOUT_MS = 90_000;

// Reserve 6Gb + 35% of memory for responding to requests and loading topology data from disk
// Remaining amount is split amongst each worker for topology data
// This strategy seems to work for any amount of host memory and targets total memory
// in use maxing out at around 80%
const dockerMemLimit = Number(
  readFileSync("/sys/fs/cgroup/memory/memory.limit_in_bytes", { encoding: "ascii" })
);
const hostmem = os.totalmem();
const totalmem = Math.min(hostmem, dockerMemLimit);
const reservedMem = 6 * 1024 * 1024 * 1024 + totalmem * 0.35;
const maxCacheSize = Math.ceil((totalmem - reservedMem) / NUM_WORKERS);

const logger = new Logger("worker-pool");
logger.debug({
  dockerMemLimit: formatBytes(dockerMemLimit),
  hostmem: formatBytes(hostmem),
  maxCacheSize: formatBytes(maxCacheSize)
});

// Implementing our own queuing system instead of using threads Pool in order to handle errors
// and thread termination with more precision
const workers = [...Array(NUM_WORKERS)].map((_, index) =>
  spawn<Functions>(new Worker("./worker", { workerData: { index } }))
);
const timeouts: Array<NodeJS.Timeout | undefined> = [...Array(NUM_WORKERS)].fill(undefined);

// Track region size & worker size so we can kill/recreate workers when they exceed a maximum size
const workerSizes = [...Array(NUM_WORKERS)].map(() => 0);
const regionSizes: { [key: string]: number } = {};

// Each queue controls access to a specific worker thread, which runs one task at a time
const workerQueues = [...Array(NUM_WORKERS)].map(() => new Queue(1));

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type WorkerThread = Awaited<typeof workers[0]>;

// Not that important to limit small regions, but large regions in every worker will eat up our cache
const MAX_PER_REGION = Math.ceil(NUM_WORKERS / 2);

// Not specific to a worker thread, this controls access to queueing new tasks onto threads
const taskRunnerQueue = new Queue(1);

// We need to terminate workers cleanly when running the test suite
export async function terminatePool() {
  const workerThreads = await Promise.all(workers);
  return Promise.all(workerThreads.map(worker => Thread.terminate(worker)));
}

function getSettledQueues(workerQueues: Queue[], indexes: number[]) {
  return indexes.filter(
    i => workerQueues[i].getPendingLength() === 0 && workerQueues[i].getQueueLength() === 0
  );
}

// Keep track of which regions have been routed to which workers, in order of recency
// We'll try to reroute back to those same workers later to re-use the workers cached data
let workersByRegion: { [id: string]: number[] } = {};
let workersByRecency: number[] = [];

async function findQueue(
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata
): Promise<number> {
  const allWorkerIndexes = [...workerQueues.keys()];
  const lastUsed = workersByRegion[regionConfig.id] || [];
  const lastUsedSettled = getSettledQueues(workerQueues, lastUsed);
  const allSettledQueues = getSettledQueues(workerQueues, allWorkerIndexes);
  const size = regionSizes[regionConfig.id];

  // Choose our next index by size
  const willFit = (worker: number) => workerSizes[worker] + size < maxCacheSize;
  const getBestFit = (workers: number[]): number =>
    (!size
      ? // Use the smallest worker if size is unknown
        _.minBy(workers, idx => workerSizes[idx])
      : // Use the largest worker that will fit if size is known
      workers.some(willFit)
      ? _.minBy(workers.filter(willFit), idx => maxCacheSize - (workerSizes[idx] + size))
      : // If no workers will fit, we use the least recently used worker
        // eslint-disable-next-line functional/immutable-data
        workersByRecency.pop()) || workers[0];

  const workerToUse: number =
    // First check for available workers that were used for this region, get most recent
    lastUsedSettled.length > 0
      ? lastUsedSettled[0]
      : // Next check if any workers are available, if we haven't hit our limit for this region
      lastUsed.length < MAX_PER_REGION && allSettledQueues.length > 0
      ? getBestFit(allSettledQueues)
      : // If we have no available workers, use the most recent for this region
      lastUsed.length > 0
      ? lastUsed[0]
      : // Lastly, just use anything
        getBestFit(allWorkerIndexes);

  // If this region wasn't already in this workers cache, update the worker size
  // This may trigger recreating the worker thread if we would exceed the max size
  if (
    !workersByRegion[regionConfig.id] ||
    !workersByRegion[regionConfig.id].includes(workerToUse)
  ) {
    const size = await getRegionSize(regionConfig, staticMetadata, workerToUse);
    if (workerSizes[workerToUse] + size > maxCacheSize) {
      await recreateWorker(workerToUse);
      // eslint-disable-next-line functional/immutable-data
      workerSizes[workerToUse] = 0;
      workersByRegion = _.mapValues(workersByRegion, workers =>
        workers.filter(w => w !== workerToUse)
      );
    }
    // eslint-disable-next-line functional/immutable-data
    workerSizes[workerToUse] += size;
  }
  // Move this worker to the top of the list of workers for this region/overall
  // eslint-disable-next-line functional/immutable-data
  workersByRegion[regionConfig.id] = [
    workerToUse,
    ...lastUsed.filter(worker => worker != workerToUse)
  ];
  workersByRecency = [workerToUse, ...workersByRecency.filter(worker => worker != workerToUse)];

  return workerToUse;
}

async function getRegionSize(
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata,
  worker: number
): Promise<number> {
  if (regionConfig.id in regionSizes) {
    return regionSizes[regionConfig.id];
  }

  const { sizeInBytes }: TopologyMetadata = await workerQueues[worker].add(async () =>
    (await workers[worker]).getTopologyMetadata(regionConfig, staticMetadata)
  );
  // eslint-disable-next-line functional/immutable-data
  regionSizes[regionConfig.id] = sizeInBytes;
  return sizeInBytes;
}

// If a worker times out or errors, or reaches its max cache size, replace it
function recreateWorker(index: number): Promise<void> {
  logger.log(
    `Recreating worker ${index}, worker cache size: ${formatBytes(
      workerSizes[index]
    )}, total rss: ${formatBytes(process.memoryUsage().rss)}`
  );
  void workers[index].then(worker => Thread.terminate(worker));
  // eslint-disable-next-line functional/immutable-data
  workers[index] = spawn<Functions>(new Worker("./worker", { workerData: { index } }));
  workers[index].catch(e => {
    logger.error(`Failed to recreated worker ${index}: ${JSON.stringify(e)}`);
  });
  return workers[index].then(() => void 0);
}

function clearQueueTimeout(index: number) {
  // Clear the timeout so we don't run the cleanup function
  const timeout = timeouts[index];
  timeout && clearTimeout(timeout);
  // eslint-disable-next-line functional/immutable-data
  timeouts[index] = undefined;
}

async function queueWithTimeout<R>(
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata,
  cb: TaskRunFunction<WorkerThread, R>
) {
  // This function is run within a queue and encompasses finding a worker queue and running a task.
  //
  // Without this queuing to limit concurrency, I encountered problems limiting regions to a
  // max number of workers, due to race conditions when finding settled workers
  return new Promise<R>(resolve => {
    void taskRunnerQueue.add(async () => {
      const workerIndex = await findQueue(regionConfig, staticMetadata);
      const task = workerQueues[workerIndex].add(() => workers[workerIndex].then(cb));
      // Clear out any timeouts after the task completes
      task.then(() => clearQueueTimeout(workerIndex)).catch(() => recreateWorker(workerIndex));
      // Also clear pre-existing timeouts if we're adding a new one before cleanup could happen
      clearQueueTimeout(workerIndex);
      // eslint-disable-next-line functional/immutable-data
      timeouts[workerIndex] = setTimeout(() => void recreateWorker(workerIndex), TASK_TIMEOUT_MS);
      resolve(task);
    });
  });
}

export const merge = (args: MergeArgs) =>
  queueWithTimeout(args.regionConfig, args.staticMetadata, worker => worker.merge(args));

export const importFromCSV = (
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  blockToDistricts: {
    readonly [block: string]: number;
  }
) =>
  queueWithTimeout(regionConfig, staticMetadata, worker =>
    worker.importFromCSV(staticMetadata, regionConfig, blockToDistricts)
  );

export const exportToCSV = (
  staticMetadata: IStaticMetadata,
  regionConfig: IRegionConfig,
  districtsDefinition: DistrictsDefinition
) =>
  queueWithTimeout(regionConfig, staticMetadata, worker =>
    worker.exportToCSV(staticMetadata, regionConfig, districtsDefinition)
  );

export const getTopologyProperties = (
  regionConfig: IRegionConfig,
  staticMetadata: IStaticMetadata
) =>
  queueWithTimeout(regionConfig, staticMetadata, worker =>
    worker.getTopologyProperties(regionConfig, staticMetadata)
  );
