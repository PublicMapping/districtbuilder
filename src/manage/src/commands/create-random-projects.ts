import { Command } from "@oclif/command";
import { IArg } from "@oclif/parser/lib/args";
import cli from "cli-ux";
import { createConnection, Repository } from "typeorm";
import _ from "lodash";

import { connectionOptions } from "../lib/dbUtils";
import { RegionConfig } from "../../../server/src/region-configs/entities/region-config.entity";
import { Project } from "../../../server/src/projects/entities/project.entity";
import { TopologyService } from "../../../server/src/districts/services/topology.service";
import { User } from "../../../server/src/users/entities/user.entity";

const PERCENT_COMPLETE = 0.25;

export default class CreateRandomProjects extends Command {
  static description = "creates randomly generated projects for development testing";

  static args: IArg[] = [
    {
      name: "number",
      description: "Number of projects to create",
      required: true
    },
    {
      name: "region",
      description: "Region code to create projects for, or 'all'. Defaults to 'all'",
      required: false,
      default: "all"
    }
  ];

  async run(): Promise<void> {
    const { args } = this.parse(CreateRandomProjects);

    const connection = await createConnection({ ...connectionOptions, logging: false });
    const regionConfigRepo = connection.getRepository(RegionConfig);
    const projectRepo = connection.getRepository(Project);
    const userRepo = connection.getRepository(User);
    const topologyService = new TopologyService(regionConfigRepo);

    const regions = await regionConfigRepo.find(
      args.region === "all"
        ? { hidden: false, archived: false }
        : { regionCode: args.region, hidden: false, archived: false }
    );

    const user = await userRepo.findOneOrFail();

    const layers = Object.values(topologyService.layers());
    this.log(`Downloading topology for ${layers.length} layers`);
    await Promise.all(layers);

    this.log(`Generating ${args.number} projects in ${regions.length} region(s)`);
    const bar = cli.progress();
    bar.start(Number(args.number));

    for (let i = 0; i < Number(args.number); i++) {
      const region = _.sample(regions);
      if (!region) {
        this.log(`No regions in database`);
        this.exit(1);
      }
      const geoCollection = await topologyService.get(region.s3URI);
      if (!geoCollection || !("merge" in geoCollection)) {
        this.log(`No active topology for region`);
        this.exit(1);
      }

      const numCounties = geoCollection.hierarchyDefinition.length;
      const numberOfDistricts = _.random(Math.ceil(numCounties / 2), numCounties);
      const project = new Project();
      const districtsDefinition = Array.from({ length: numCounties }, () =>
        _.random(1, numberOfDistricts)
      );
      // Set a percentage of projects to be incomplete by assigning a random block to the unassigned district
      if (_.random(0, 1, true) >= PERCENT_COMPLETE) {
        const countyIdx = _.random(0, numCounties - 1);
        districtsDefinition[countyIdx] = 0;
      }
      const lockedDistricts = new Array(numberOfDistricts).fill(false);
      const districts = geoCollection.merge({ districts: districtsDefinition }, numberOfDistricts);
      if (!districts) {
        this.log(`Could not generate geojson`);
        this.exit(1);
      }
      project.name = `Project ${i} ${region.regionCode}`;
      project.numberOfDistricts = numberOfDistricts;
      project.regionConfig = region;
      project.districtsDefinition = districtsDefinition;
      project.districts = districts;
      project.lockedDistricts = lockedDistricts;
      project.populationDeviation = 5;
      project.user = user;
      project.regionConfigVersion = region.version;

      // @ts-ignore
      await projectRepo.save(project, { reload: false });
      bar.increment();
    }
    bar.stop();
    this.log(`Projects created`);
  }
}
