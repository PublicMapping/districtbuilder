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

  async findAdminOrgProjects(slug: string): Promise<ProjectTemplate[]> {
    // Returns admin-only listing of all organization projects
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
        "projects.districtsDefinition",
        "regionConfig.name",
        "user.name"
      ])
      .getMany();
    return data;
  }

  async findOrgFeaturedProjects(slug: string): Promise<ProjectTemplate[]> {
    // Returns public listing of all featured projects for an organization
    const builder = this.repo.createQueryBuilder("projectTemplate");
    const data = await builder
      .innerJoinAndSelect("projectTemplate.organization", "organization")
      .innerJoinAndSelect("projectTemplate.regionConfig", "regionConfig")
      .leftJoinAndSelect("projectTemplate.projects", "projects", "projects.isFeatured = TRUE")
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
        "projects.districtsDefinition",
        "projects.districts",
        "regionConfig.name",
        "user.name"
      ])
      .getMany();
    return data;
  }
}
