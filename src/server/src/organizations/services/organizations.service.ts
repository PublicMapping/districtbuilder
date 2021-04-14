import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";

import { Organization } from "../entities/organization.entity";

@Injectable()
export class OrganizationsService extends TypeOrmCrudService<Organization> {
  constructor(@InjectRepository(Organization) repo: Repository<Organization>) {
    super(repo);
  }

  save(org: Organization): Promise<Organization> {
    // @ts-ignore
    return this.repo.save(org);
  }

  async getOrgAndProjectTemplates(slug: string): Promise<Organization | undefined> {
    // Returns public data for organization screen
    const builder = this.repo.createQueryBuilder("organization");
    const data = await builder
      .leftJoinAndSelect("organization.users", "users")
      .leftJoinAndSelect("organization.admin", "admin")
      .leftJoinAndSelect(
        "organization.projectTemplates",
        "projectTemplates",
        "projectTemplates.isActive = TRUE"
      )
      .leftJoinAndSelect("projectTemplates.regionConfig", "regionConfig")
      .where("organization.slug = :slug", { slug: slug })
      .select([
        "organization.id",
        "organization.slug",
        "organization.name",
        "organization.description",
        "organization.linkUrl",
        "organization.logoUrl",
        "organization.municipality",
        "organization.region",
        "users.id",
        "users.name",
        "admin.id",
        "admin.name",
        "projectTemplates.id",
        "projectTemplates.name",
        "regionConfig.name",
        "regionConfig.id",
        "regionConfig.countryCode",
        "regionConfig.regionCode",
        "projectTemplates.numberOfDistricts",
        "projectTemplates.description",
        "projectTemplates.details",
        "projectTemplates.isActive"
      ])
      .getOne();
    return data;
  }
}
