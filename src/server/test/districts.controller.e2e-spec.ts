import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";

import { IRegionConfig } from "../../shared/entities";
import { RegionConfig } from "../src/region-configs/entities/region-config.entity";
import { RegionConfigsService } from "../src/region-configs/services/region-configs.service";
import { DistrictsModule } from "../src/districts/districts.module";
import { TopologyService } from "../src/districts/services/topology.service";
import { WorkerPoolService } from "../src/districts/services/worker-pool.service";

describe("DistrictsController", () => {
  let app: INestApplication;
  const region = {
    id: "1",
    name: "Delaware",
    regionCode: "DE",
    countryCode: "US",
    s3URI: "s3://global-districtbuilder-dev-us-east-1/regions/US/DE/2020-09-09T19:50:10.921Z/",
    archived: false,
    version: new Date("2020-09-09T19:50:10.921Z")
  } as IRegionConfig;

  let regionConfigsService = {
    findOne: (conditions: unknown) => Promise.resolve(region)
  };
  let regionConfigsRepo = {
    find: () => Promise.resolve([region])
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DistrictsModule]
    })
      .overrideProvider(getRepositoryToken(RegionConfig))
      .useValue(regionConfigsRepo)
      .overrideProvider(RegionConfigsService)
      .useValue(regionConfigsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    app.select(DistrictsModule).get(TopologyService, { strict: true }).loadLayers();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await app.select(DistrictsModule).get(WorkerPoolService, { strict: true }).terminatePool();
  });

  describe("import plan from block equivalency CSV", () => {
    it("should return a districts definition", () => {
      return request(app.getHttpServer())
        .post("/api/districts/import/csv")
        .attach("file", `${__dirname}/data/de.csv`)
        .expect(200)
        .expect({ districtsDefinition: [2, 1, 3], maxDistrictId: 3 });
    });
  });

  describe("import plan from block equivalency CSV with invalid block id in first row", () => {
    it("should return a flag", () => {
      return request(app.getHttpServer())
        .post("/api/districts/import/csv")
        .attach("file", `${__dirname}/data/bad_blockid.csv`)
        .expect(200)
        .expect({
          districtsDefinition: [2, 1, 3],
          maxDistrictId: 3,
          numFlags: 1,
          rowFlags: [
            {
              rowNumber: 0,
              errorText: "Invalid block ID",
              rowValue: ["100059900000024", "3"],
              field: "BLOCKID"
            }
          ]
        });
    });
  });
});
