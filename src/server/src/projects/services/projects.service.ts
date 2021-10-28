import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { simplify } from "simplify-geojson";
import bbox from "@turf/bbox";
import { BBox } from "@turf/helpers";
import { Repository, SelectQueryBuilder, DeepPartial } from "typeorm";
import _ from "lodash";

import { Project } from "../entities/project.entity";
import { ProjectVisibility } from "../../../../shared/constants";
import { paginate, Pagination, IPaginationOptions } from "nestjs-typeorm-paginate";

type AllProjectsOptions = IPaginationOptions & {
  readonly completed?: boolean;
  readonly region?: string;
  readonly userId?: string;
};

@Injectable()
export class ProjectsService extends TypeOrmCrudService<Project> {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(@InjectRepository(Project) repo: Repository<Project>) {
    super(repo);
  }

  save(project: DeepPartial<Project>): Promise<Project> {
    // @ts-ignore
    return this.repo.save(project);
  }

  getProjectsBase(): SelectQueryBuilder<Project> {
    return this.repo
      .createQueryBuilder("project")
      .innerJoin("project.regionConfig", "regionConfig")
      .innerJoin("project.user", "user")
      .leftJoin("project.chamber", "chamber")
      .select([
        "project.id",
        "project.name",
        "project.numberOfDistricts",
        "project.updatedDt",
        "project.createdDt",
        "project.districts",
        "regionConfig.name",
        "regionConfig.id",
        "user.id",
        "user.name"
      ])
      .orderBy("project.updatedDt", "DESC");
  }

  computeBBoxArea(project: Project): number {
    const box: BBox = bbox(project.districts);
    return (box[2] - box[0]) * (box[3] - box[1]);
  }

  // We only use the districts column for displaying a mini-map outside of the main Project Screen
  // so we can simplify the geometries to save on size and improve performance
  async simplifyDistricts(page: Promise<Pagination<Project>>): Promise<Pagination<Project>> {
    const projects = await page;
    projects.items.forEach(project => {
      const boxArea = this.computeBBoxArea(project);
      project.districts &&
        project.districts.features.forEach(districtFeature => {
          const tolerance = boxArea > 1 ? 0.005 : 0.001;
          try {
            simplify(districtFeature, tolerance);
          } catch (e) {
            this.logger.debug(
              `Could not simplify district ${districtFeature.id} for project ${project.id}: ${e}`
            );
          }
        });
    });
    return projects;
  }

  async findAllPublishedProjectsPaginated(
    options: AllProjectsOptions
  ): Promise<Pagination<Project>> {
    const builder = this.getProjectsBase()
      .andWhere("project.visibility = :published", {
        published: ProjectVisibility.Published
      })
      .andWhere("project.archived = FALSE");
    const builderWithFilter = options.completed
      ? // Completed projects are defined as having no geo units assigned to the unassigned district
        //
        // Note: while data updates might change what population is assigned, we don't expect them to
        // change geometries, so this should be safe even with a stale 'districts' colum
        builder.andWhere(
          "jsonb_array_length(project.districts->'features'->0->'geometry'->'coordinates')::integer = 0"
        )
      : builder;
    const builderWithRegion = options.region
      ? builderWithFilter.andWhere("regionConfig.regionCode = :region", { region: options.region })
      : builderWithFilter;

    return this.simplifyDistricts(paginate<Project>(builderWithRegion, options));
  }

  async findAllUserProjectsPaginated(
    userId: string,
    options: AllProjectsOptions
  ): Promise<Pagination<Project>> {
    const builder = this.getProjectsBase().andWhere(
      "project.archived = FALSE AND user.id = :userId",
      { userId }
    );

    return this.simplifyDistricts(paginate<Project>(builder, options));
  }
}
