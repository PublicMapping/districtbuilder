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
      .select()
      .leftJoin("organization.users", "users")
      .leftJoin("organization.admin", "admin")
      .leftJoinAndSelect(
        "organization.projectTemplates",
        "projectTemplates",
        "projectTemplates.isActive = TRUE"
      )
      .leftJoinAndSelect("projectTemplates.regionConfig", "regionConfig")
      .where("organization.slug = :slug", { slug: slug })
      .addSelect(["users.id", "users.name", "admin.id", "admin.name"])
      .getOne();
    return data;
  }
}
