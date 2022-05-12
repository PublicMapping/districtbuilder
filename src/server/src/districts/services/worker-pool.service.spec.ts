import { Test, TestingModule } from "@nestjs/testing";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { maxWorkerCacheSize, WorkerPoolService, WorkerThread } from "./worker-pool.service";

describe("WorkerPoolService", () => {
  let service: WorkerPoolService;

  const regions = [
    {
      id: "1",
      layerSizeInBytes: 100
    },
    {
      id: "2",
      layerSizeInBytes: 100
    },
    {
      id: "3",
      layerSizeInBytes: 100
    }
  ] as RegionConfig[];

  beforeEach(async () => {
    jest.mock("../../worker");

    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkerPoolService]
    }).compile();

    service = module.get<WorkerPoolService>(WorkerPoolService);
  });

  afterEach(async () => {
    await service.terminatePool();
  });

  async function workerIndex(worker: WorkerThread) {
    const workers = await Promise.all(service.workers);
    return workers.indexOf(worker);
  }
  async function sleep(timeout: number) {
    await new Promise(r => setTimeout(r, timeout));
  }

  it("WorkerPoolService - should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("queueWithTimeout", () => {
    it("should route to a worker", async () => {
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
    });

    it("should reroute back to the same worker for the same region", async () => {
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
    });

    it("should route to MAX_PER_REGION workers for concurrent requests", async () => {
      // Create all workers 1st using other regions

      await Promise.all([
        service.queueWithTimeout(regions[1], async () => sleep(10)),
        service.queueWithTimeout(regions[1], async () => sleep(10)),
        service.queueWithTimeout(regions[2], async () => sleep(10)),
        service.queueWithTimeout(regions[2], async () => sleep(10))
      ]);
      // Even w/ more than MAX_PER_REGION concurrent requests we should still be
      // limited in how many workers we load data onto
      await Promise.all([
        service.queueWithTimeout(regions[0], async worker => {
          expect([0, 1]).toContain(await workerIndex(worker));
        }),
        service.queueWithTimeout(regions[0], async worker => {
          expect([0, 1]).toContain(await workerIndex(worker));
        }),
        service.queueWithTimeout(regions[0], async worker => {
          expect([0, 1]).toContain(await workerIndex(worker));
        }),
        service.queueWithTimeout(regions[0], async worker => {
          expect([0, 1]).toContain(await workerIndex(worker));
        })
      ]);
    }, 10_000);

    it("should route to a new worker for the same region if existing is blocked", async () => {
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
      const blockingRequest = service.queueWithTimeout(regions[0], async worker => {
        // Sleep for a bit to ensure this is still busy for the 2nd request
        await sleep(10);
        expect(await workerIndex(worker)).toEqual(0);
      });
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).not.toEqual(0);
      });
      await blockingRequest;
    }, 10_000);

    it("should route to a new worker for the same region if existing is blocked by a different region", async () => {
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
      const blockingRequest = service.queueWithTimeout(regions[1], async worker => {
        // Sleep for a bit to ensure this is still busy for the 2nd request
        await sleep(10);
        expect(await workerIndex(worker)).toEqual(0);
      });
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).not.toEqual(0);
      });
      await blockingRequest;
    }, 10_000);

    it("should wait for a busy worker once # of workers = MAX_PER_REGION", async () => {
      const first = service.queueWithTimeout(regions[0], async worker => {
        // Sleep for a bit to ensure this is still busy for the next request
        await sleep(10);

        expect(await workerIndex(worker)).toEqual(0);
      });
      const second = service.queueWithTimeout(regions[0], async worker => {
        // Sleep for a bit to ensure this is still busy for the next request
        await sleep(10);

        expect(await workerIndex(worker)).toEqual(1);
      });
      await service.queueWithTimeout(regions[0], async worker => {
        const index = await workerIndex(worker);
        expect([0, 1]).toContain(index);
      });
      await first;
      await second;
    }, 10_000);

    it("should not double-count pending requests when routing to workers", async () => {
      // Load testing region onto worker 0
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
      // Block every worker with other regions
      const otherRegionRequests = Promise.all([
        service.queueWithTimeout(regions[1], async () => {
          await sleep(10);
        }),
        service.queueWithTimeout(regions[1], async () => {
          await sleep(10);
        }),
        service.queueWithTimeout(regions[2], async () => {
          await sleep(10);
        }),
        service.queueWithTimeout(regions[2], async () => {
          await sleep(10);
        })
      ]);
      // This request should try to route to worker 1 and block
      const pendingRequest = service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(1);
      });

      // With all workers blocked and one request pending for worker 0, this should
      // route to worker 0
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
      await otherRegionRequests;
      await pendingRequest;
    }, 10_000);

    it("should terminate worker on OoM", async () => {
      const spy = jest.spyOn(service, "terminateWorker");
      const giantRegion = (id: string) =>
        ({
          id,
          layerSizeInBytes: maxWorkerCacheSize - 1
        } as RegionConfig);

      // Fill each worker with a region that takes up the whole cache
      await service.queueWithTimeout(giantRegion("A"), async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
      expect(spy).toBeCalledWith(0, "");
      await service.queueWithTimeout(giantRegion("B"), async worker => {
        expect(await workerIndex(worker)).toEqual(1);
      });
      expect(spy).toBeCalledWith(1, "");
      await service.queueWithTimeout(giantRegion("C"), async worker => {
        expect(await workerIndex(worker)).toEqual(2);
      });
      expect(spy).toBeCalledWith(2, "");

      // Adding a small region should cause an OoM error, terminating worker 0, the least recently used
      await service.queueWithTimeout(regions[0], async worker => {
        expect(await workerIndex(worker)).toEqual(0);
      });
      expect(spy).toBeCalledWith(0, "OoM");
    }, 10_000);

    it("should return an error and terminate worker on timeouts", async () => {
      const spy = jest.spyOn(service, "terminateWorker");
      await expect(
        service.queueWithTimeout(
          regions[0],
          async () => {
            await sleep(100);
            return;
          },
          10
        )
      ).rejects.toMatch("Worker request timed out");
      expect(spy).toBeCalledWith(0, "error");
    });

    it("should return an error and terminate worker on errors", async () => {
      const spy = jest.spyOn(service, "terminateWorker");
      await expect(
        service.queueWithTimeout(regions[0], async () => {
          await sleep(1);
          throw new Error("Horrors");
        })
      ).rejects.toMatchObject({ message: "Horrors" });
      expect(spy).toBeCalledWith(0, "error");
    });
  });
});
