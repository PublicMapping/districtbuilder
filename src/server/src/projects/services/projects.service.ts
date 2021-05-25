import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";

import { Project } from "../entities/project.entity";
import { ProjectVisibility } from "../../../../shared/constants";


@Injectable()
export class ProjectsService extends TypeOrmCrudService<Project> {
  constructor(@InjectRepository(Project) repo: Repository<Project>) {
    super(repo);
  }
  save(project: Project): Promise<Project> {
    // @ts-ignore
    return this.repo.save(project);
  }

  async findAllPublishedProjects(): Promise<Project[]> {
    // Returns admin-only listing of all organization projects
    const builder = this.repo.createQueryBuilder("project");
    const data = await builder
      .innerJoinAndSelect("project.regionConfig", "regionConfig")
      .innerJoinAndSelect("project.user", "user")
      .where("project.visibility = :published", { published: ProjectVisibility.Published })
      .select([
        "project.id",
        "project.numberOfDistricts",
        "project.name",
        "project.updatedDt",
        "project.districts",
        "regionConfig.name",
        "user.name",
        "user.email"
      ])
      .orderBy("project.name")
      .getMany();
    return data;
  }
}
