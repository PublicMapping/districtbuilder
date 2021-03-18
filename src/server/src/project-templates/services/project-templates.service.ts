import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";

import { ProjectTemplate } from "../entities/project-template.entity";

@Injectable()
export class ProjectTemplatesService extends TypeOrmCrudService<ProjectTemplate> {
  constructor(@InjectRepository(ProjectTemplate) repo: Repository<ProjectTemplate>) {
    super(repo);
  }

  async findOrgProjects(slug: string): Promise<ProjectTemplate[]> {
    const builder = this.repo.createQueryBuilder("projectTemplate");
    const data = await builder
      .innerJoinAndSelect("projectTemplate.organization", "organization")
      .innerJoinAndSelect("projectTemplate.regionConfig", "regionConfig")
      .innerJoinAndSelect("projectTemplate.projects", "projects")
      .innerJoinAndSelect("projects.user", "user")
      .where("organization.slug = :slug", { slug: slug })
      .andWhere("projectTemplate.isActive = TRUE")
      .select([
        "projectTemplate.name",
        "projectTemplate.numberOfDistricts",
        "projectTemplate.id",
        "projects.name",
        "projects.isFeatured",
        "projects.id",
        "projects.updatedDt",
        "regionConfig.name",
        "user.name"
      ])
      .getMany();
    return data;
  }
}
