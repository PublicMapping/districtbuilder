import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";

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
  constructor(@InjectRepository(Project) repo: Repository<Project>) {
    super(repo);
  }
  save(project: Project): Promise<Project> {
    // @ts-ignore
    return this.repo.save(project);
  }

  getProjectsBase(): SelectQueryBuilder<Project> {
    return this.repo
      .createQueryBuilder("project")
      .innerJoinAndSelect("project.regionConfig", "regionConfig")
      .innerJoinAndSelect("project.user", "user")
      .leftJoinAndSelect("project.chamber", "chamber")
      .select([
        "project.id",
        "project.numberOfDistricts",
        "project.name",
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

  async findAllPublishedProjectsPaginated(
    options: AllProjectsOptions
  ): Promise<Pagination<Project>> {
    const builder = this.getProjectsBase().andWhere("project.visibility = :published", {
      published: ProjectVisibility.Published
    });
    const builderWithFilter = options.completed
      ? // Completed projects are defined as having no population in the unassigned district
        builder.andWhere(
          "(project.districts->'features'->0->'properties'->'demographics'->'population')::integer = 0"
        )
      : builder;
    const builderWithRegion = options.region
      ? builderWithFilter.andWhere("regionConfig.regionCode = :region", { region: options.region })
      : builderWithFilter;
    return paginate<Project>(builderWithRegion, options);
  }

  async findAllUserProjectsPaginated(
    userId: string,
    options: AllProjectsOptions
  ): Promise<Pagination<Project>> {
    const builder = this.getProjectsBase()
      .addSelect("project.districtsDefinition")
      .andWhere("project.archived = FALSE AND user.id = :userId", { userId });

    return paginate<Project>(builder, options);
  }
}
