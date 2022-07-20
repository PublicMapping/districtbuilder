import { Test } from "@nestjs/testing";
import { ModuleMocker, MockFunctionMetadata } from "jest-mock";
import * as uuid from "uuid";

import { ProjectsController } from "./projects.controller";
import { Project } from "../entities/project.entity";
import { ProjectsService } from "../services/projects.service";
import { DeepPartial } from "typeorm";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { DEFAULT_PINNED_METRIC_FIELDS, ProjectVisibility } from "../../../../shared/constants";
import { CrudRequest } from "@nestjsx/crud";
import { TopologyService } from "../../districts/services/topology.service";

const moduleMocker = new ModuleMocker(global);

describe("ProjectsController", () => {
  let controller: ProjectsController;
  let topologyService: TopologyService;
  const userId = "1";
  const projectId = uuid.v4();
  const regionConfig: DeepPartial<RegionConfig> = {
    id: uuid.v4(),
    name: "Delaware",
    regionCode: "DE",
    countryCode: "US",
    s3URI: "s3://global-districtbuilder-dev-us-east-1/regions/US/DE/2020-09-09T19:50:10.921Z/",
    archived: true,
    hidden: false,
    version: new Date("2020-09-09T19:50:10.921Z")
  };
  const project: DeepPartial<Project> = {
    id: projectId,
    name: "My Map",
    regionConfig: regionConfig,
    regionConfigVersion: regionConfig.version,
    numberOfDistricts: 2,
    districts: {
      type: "FeatureCollection",
      features: []
    },
    user: { id: userId },
    createdDt: new Date("2022-07-12T19:50:10.921Z"),
    updatedDt: new Date("2022-07-13T19:50:10.921Z"),
    advancedEditingEnabled: false,
    lockedDistricts: [false, false, false],
    visibility: ProjectVisibility.Private,
    archived: false,
    isFeatured: false,
    populationDeviation: 0,
    pinnedMetricFields: DEFAULT_PINNED_METRIC_FIELDS,
    numberOfMembers: [1, 1],
    planscoreUrl: ""
  };
  /* eslint-disable functional/immutable-data */
  // @ts-ignore
  project.districtsDefinition = [0, 1, 2];
  /* eslint-enable */

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController]
    })
      .useMocker(token => {
        if (token === ProjectsService) {
          return {
            findOne: jest.fn().mockResolvedValue(project),
            updateOne: (req: unknown, data: DeepPartial<Project>) => Promise.resolve(data)
          };
        }
        if (typeof token === "function") {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          // eslint-disable-next-line
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(ProjectsController);
    topologyService = moduleRef.get(TopologyService);
  });

  describe("updateOne", () => {
    it("should not load topology when geojson updates are not needed", async () => {
      const result = await controller.updateOne(
        projectId,
        { parsed: { authPersist: { userId } }, options: null } as unknown as CrudRequest,
        { archived: true }
      );
      expect(result).toBeDefined();
      // eslint-disable-next-line
      expect(topologyService.get).not.toHaveBeenCalled();
    });
  });
});
