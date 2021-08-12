import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";

import { ProjectTemplate } from "../entities/project-template.entity";
import { ProjectVisibility } from "../../../../shared/constants";
import {
  OrganizationSlug,
  DistrictProperties,
  UserId,
  ProjectId
} from "../../../../shared/entities";

export type ProjectExportRow = {
  readonly userId: UserId;
  readonly userName: string;
  readonly userEmail: string;
  readonly mapName: string;
  readonly projectId: ProjectId;
  readonly createdDt: Date;
  readonly updatedDt: Date;
  readonly templateName: string;
  readonly regionName: string;
  readonly regionS3URI: string;
  readonly chamberName?: string;
  readonly districtProperties: readonly DistrictProperties[];
};

@Injectable()
export class ProjectTemplatesService extends TypeOrmCrudService<ProjectTemplate> {
  constructor(@InjectRepository(ProjectTemplate) repo: Repository<ProjectTemplate>) {
    super(repo);
  }

  async findAdminOrgProjectsWithDistrictProperties(
    slug: OrganizationSlug
  ): Promise<ProjectExportRow[]> {
    // Returns admin-only listing of all organization projects, with data for CSV export
    const builder = this.repo
      .createQueryBuilder("projectTemplate")
      .innerJoin("projectTemplate.organization", "organization")
      .innerJoin("projectTemplate.regionConfig", "regionConfig")
      .innerJoin("projectTemplate.projects", "projects")
      .innerJoin("projects.user", "user")
      .leftJoin("projects.chamber", "chamber")
      .where("organization.slug = :slug", { slug })
      .andWhere("projects.visibility <> :private", { private: ProjectVisibility.Private })
      .andWhere("projects.archived <> TRUE")
      .select("user.id", "userId")
      .addSelect("user.name", "userName")
      .addSelect("user.email", "userEmail")
      .addSelect("projects.name", "mapName")
      .addSelect("projects.id", "projectId")
      .addSelect("projects.createdDt", "createdDt")
      .addSelect("projects.updatedDt", "updatedDt")
      .addSelect("projectTemplate.name", "templateName")
      .addSelect("regionConfig.name", "regionName")
      .addSelect("regionConfig.s3URI", "regionS3URI")
      .addSelect("chamber.name", "chamberName")
      .addSelect(
        // Extract just the geojson properties, so we avoid querying the (much larger) geometries
        `jsonb_path_query_array("projects"."districts", '$.features[*].properties')`,
        "districtProperties"
      )
      .orderBy("projects.name");
    return builder.getRawMany<ProjectExportRow>();
  }

  async findAdminOrgProjects(slug: string): Promise<ProjectTemplate[]> {
    // Returns admin-only listing of all organization projects
    const builder = this.repo.createQueryBuilder("projectTemplate");
    const data = await builder
      .innerJoinAndSelect("projectTemplate.organization", "organization")
      .innerJoinAndSelect("projectTemplate.regionConfig", "regionConfig")
      .innerJoinAndSelect("projectTemplate.projects", "projects")
      .innerJoinAndSelect("projects.user", "user")
      .where("organization.slug = :slug", { slug })
      .andWhere("projects.visibility <> :private", { private: ProjectVisibility.Private })
      .andWhere("projects.archived <> TRUE")
      .select([
        "projectTemplate.name",
        "projectTemplate.numberOfDistricts",
        "projectTemplate.id",
        "projects.name",
        "projects.isFeatured",
        "projects.id",
        "projects.updatedDt",
        "projects.visibility",
        "regionConfig.name",
        "user.name",
        "user.email"
      ])
      .orderBy("projects.name")
      .getMany();
    return data;
  }

  async findOrgFeaturedProjects(slug: OrganizationSlug): Promise<ProjectTemplate[]> {
    // Returns public listing of all featured projects for an organization
    const builder = this.repo.createQueryBuilder("projectTemplate");
    const data = await builder
      .innerJoinAndSelect("projectTemplate.organization", "organization")
      .innerJoinAndSelect("projectTemplate.regionConfig", "regionConfig")
      .leftJoinAndSelect("projectTemplate.projects", "projects", "projects.isFeatured = TRUE")
      .innerJoinAndSelect("projects.user", "user")
      .where("organization.slug = :slug", { slug: slug })
      .select([
        "projectTemplate.name",
        "projectTemplate.numberOfDistricts",
        "projectTemplate.id",
        "projects.name",
        "projects.isFeatured",
        "projects.id",
        "projects.updatedDt",
        "projects.districts",
        "regionConfig.name",
        "user.name"
      ])
      .orderBy("projects.name")
      .getMany();
    return data;
  }
}
