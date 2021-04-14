import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";

import { IRegionConfig } from "../../shared/entities";
import { RegionConfig } from "../src/region-configs/entities/region-config.entity";
import { RegionConfigsService } from "../src/region-configs/services/region-configs.service";
import { DistrictsModule } from "../src/districts/districts.module";

describe("DistrictsController", () => {
  let app: INestApplication;
  const region = {
    id: "1",
    name: "Delaware",
    regionCode: "DE",
    countryCode: "US",
    s3URI: "s3://global-districtbuilder-dev-us-east-1/regions/US/DE/2020-09-09T19:50:10.921Z/"
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe("import plan from block equivalency CSV", () => {
    it("should return a districts definition", () => {
      return request(app.getHttpServer())
        .post("/api/districts/import/csv")
        .attach("file", `${__dirname}/data/de.csv`)
        .expect(200)
        .expect([2, 1, 3]);
    });
  });
});
