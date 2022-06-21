/* eslint-disable @typescript-eslint/unbound-method */
import { DataType, IBackup, newDb } from "pg-mem";
import { v4 } from "uuid";
import * as typeorm from "typeorm";

import CreateRandomProjects from "../commands/create-random-projects";
import { RegionConfig } from "../../../server/src/region-configs/entities/region-config.entity";
import { Project } from "../../../server/src/projects/entities/project.entity";
import { User } from "../../../server/src/users/entities/user.entity";
import { createConnection } from "typeorm";
import { connectionOptions } from "../lib/dbUtils";

jest.mock("typeorm", () => {
  const original = jest.requireActual("typeorm");
  return {
    ...original,
    createConnection: jest.fn()
  };
});
jest.mock("../../../server/src/worker");
jest.mock("../../../server/src/districts/services/worker-pool.service", () => {
  return {
    WorkerPoolService: jest.fn().mockImplementation(() => ({
      getTopologyProperties: () => Promise.resolve({ county: [] }),
      merge: () =>
        Promise.resolve({
          districts: { type: "FeatureCollection", features: [] },
          simplifiedDistricts: { type: "FeatureCollection", features: [] }
        })
    }))
  };
});
jest.useFakeTimers({ advanceTimers: true });

describe("Create random projects", () => {
  let regionConfigRepo: typeorm.Repository<RegionConfig>;
  let projectRepo: typeorm.Repository<Project>;
  let userRepo: typeorm.Repository<User>;
  let user: User;
  let testDb;
  let connection: typeorm.Connection;
  let dbBackup: IBackup;

  beforeAll(async () => {
    testDb = newDb({
      autoCreateForeignKeyIndices: true
    });

    testDb.public.registerFunction({
      name: "current_database",
      returns: DataType.text,
      implementation: () => "districtbuilder"
    });
    testDb.registerExtension("uuid-ossp", schema => {
      schema.registerFunction({
        name: "uuid_generate_v4",
        returns: DataType.uuid,
        implementation: v4,
        impure: true
      });
    });

    const mockedCreateConnection = createConnection as jest.MockedFunction<typeof createConnection>;
    connection = await testDb.adapters.createTypeormConnection({
      type: connectionOptions.type,
      entities: connectionOptions.entities
    });

    mockedCreateConnection.mockImplementation(() => Promise.resolve(connection));
    // Create database tables
    await connection.synchronize();
    dbBackup = testDb.backup();
  });

  function addRegion(s3URI: string) {
    return regionConfigRepo.save({
      id: v4(),
      s3URI,
      name: s3URI.substring(53, 55),
      regionCode: s3URI.substring(53, 55),
      countryCode: "US",
      archived: false,
      version: new Date("2020-09-09T19:50:10.921Z")
    });
  }

  beforeEach(async () => {
    user = new User();
    user.email = "test@example.com";
    user.name = "Mike";
    await user.setPassword("password");
    regionConfigRepo = connection.getRepository(RegionConfig);
    projectRepo = connection.getRepository(Project);
    userRepo = connection.getRepository(User);
    // @ts-ignore
    await userRepo.save(user);
  });

  afterEach(() => {
    jest.clearAllTimers();
    dbBackup.restore();
  });

  it("should create a project", async () => {
    expect.assertions(2);
    await addRegion(
      "s3://global-districtbuilder-dev-us-east-1/regions/US/DE/2020-09-09T19:50:10.921Z/"
    );
    try {
      await CreateRandomProjects.run(["1"]);
    } catch (err: any) {
      expect(err.oclif.exit).toBe(0);
      expect(await projectRepo.count()).toBe(1);
    }
  });

  it("should create no project if there are no regions", async () => {
    expect.assertions(2);
    try {
      await CreateRandomProjects.run(["1"]);
    } catch (err: any) {
      expect(err.oclif.exit).toBe(1);
      expect(await projectRepo.count()).toBe(0);
    }
  });

  it("should wait until all layers have loaded", async () => {
    expect.assertions(2);
    // We download at most 6 layers at a time in development, so having 7 regions
    // should mean at least one is still pending
    await Promise.all(
      [
        "s3://global-districtbuilder-dev-us-east-1/regions/US/DE/2020-09-09T19:50:10.921Z/",
        "s3://global-districtbuilder-dev-us-east-1/regions/US/CT/2021-10-26T00:33:03.521Z/",
        "s3://global-districtbuilder-dev-us-east-1/regions/US/DC/2021-08-13T09:30:57.826Z/",
        "s3://global-districtbuilder-dev-us-east-1/regions/US/ND/2021-11-09T05:17:57.283Z/",
        "s3://global-districtbuilder-dev-us-east-1/regions/US/PR/2022-01-07T22:22:27.542Z/",
        "s3://global-districtbuilder-dev-us-east-1/regions/US/RI/2021-08-13T08:34:27.788Z/",
        "s3://global-districtbuilder-dev-us-east-1/regions/US/VT/2021-08-13T09:51:55.169Z/"
      ].map(addRegion)
    );
    try {
      await CreateRandomProjects.run(["1", "VT"]);
    } catch (err: any) {
      expect(err.oclif.exit).toBe(0);
      expect(await projectRepo.count()).toBe(1);
    }
  }, 60_000);
});
