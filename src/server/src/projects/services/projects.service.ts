import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";

import { Project } from "../entities/project.entity";
import { ProjectVisibility } from "../../../../shared/constants";
import { paginate, Pagination, IPaginationOptions } from "nestjs-typeorm-paginate";

type AllProjectsOptions = IPaginationOptions & {
  readonly completed?: boolean;
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

  async findAllPublishedProjectsPaginated(
    options: AllProjectsOptions
  ): Promise<Pagination<Project>> {
    // Returns admin-only listing of all organization projects
    const builder = this.repo
      .createQueryBuilder("project")
      .innerJoinAndSelect("project.regionConfig", "regionConfig")
      .innerJoinAndSelect("project.user", "user")
      .leftJoinAndSelect("project.chamber", "chamber")
      .where("project.visibility = :published", { published: ProjectVisibility.Published })
      .select([
        "project.id",
        "project.numberOfDistricts",
        "project.name",
        "project.updatedDt",
        "project.createdDt",
        "project.districts",
        "regionConfig.name",
        "user.id",
        "user.name"
      ])
      .orderBy("project.updatedDt", "DESC");
    const builderWithFilter = options.completed
      ? // Completed projects are defined as having no population in the unassigned district
        builder.andWhere(
          "(project.districts->'features'->0->'properties'->'demographics'->'population')::integer = 0"
        )
      : builder;
    return paginate<Project>(builderWithFilter, options);
  }
}
