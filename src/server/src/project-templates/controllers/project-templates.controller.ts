import { Controller, UseGuards, Param, Post, NotFoundException, Body, Get } from "@nestjs/common";
import { Crud, CrudController } from "@nestjsx/crud";
import { IsNotEmpty } from "class-validator";

import { OrganizationSlug, PublicUserProperties, UserId } from "../../../../shared/entities";
import { JoinOrganizationErrors } from "../../../../shared/constants";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";

import { ProjectTemplate } from "../entities/project-template.entity";
import { ProjectTemplatesService } from "../services/project-templates.service";


@Crud({
  model: {
    type: ProjectTemplate
  },
  routes: {
    only: ["getManyBase"]
  },
  params: {
    org: {
      field: "organization.slug",
      type: "string",
      primary: true
    }
  },
  query: {
    join: {
      projects: {
        eager: true
      }
    }
  }
})
@Controller("api/project_templates")
// @ts-ignore
export class ProjectTemplatesController implements CrudController<ProjectTemplate> {
  constructor(public service: ProjectTemplatesService) {}

  @UseGuards(JwtAuthGuard)
  @Get(":slug/")
  async getProjects(
    @Param("slug") organizationSlug: OrganizationSlug,
  ): Promise<ProjectTemplate[]> {
    return this.service.findOrgProjects(organizationSlug)

  }

}
