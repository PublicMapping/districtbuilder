import {
  Controller,
  UseGuards,
  Param,
  Post,
  NotFoundException,
  Body,
  Get,
  Request,
  BadRequestException
} from "@nestjs/common";
import { Crud, CrudController, CrudRequest, ParsedRequest } from "@nestjsx/crud";
import { IsNotEmpty } from "class-validator";

import { OrganizationSlug, PublicUserProperties, UserId } from "../../../../shared/entities";
import { JoinOrganizationErrors } from "../../../../shared/constants";
import { Organization } from "../../organizations/entities/organization.entity";

import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";

import { ProjectTemplate } from "../entities/project-template.entity";
import { ProjectTemplatesService } from "../services/project-templates.service";
import { OrganizationsService } from "../../organizations/services/organizations.service";

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
  }
})
@Controller("api/project_templates")
// @ts-ignore
export class ProjectTemplatesController implements CrudController<ProjectTemplate> {
  constructor(public service: ProjectTemplatesService, public orgService: OrganizationsService) {}

  async getOrg(organizationSlug: OrganizationSlug): Promise<Organization> {
    const org = await this.orgService.getOrgAndProjectTemplates(organizationSlug);
    if (!org) {
      throw new NotFoundException(`Organization ${organizationSlug} not found`);
    }
    return org;
  }

  async getOrgFeaturedProjects(organizationSlug: OrganizationSlug): Promise<ProjectTemplate[]> {
    const projects = await this.service.findOrgFeaturedProjects(organizationSlug);
    if (!projects) {
      throw new NotFoundException(`Organization ${organizationSlug} not found`);
    }
    return projects;
  }

  @UseGuards(JwtAuthGuard)
  @Get(":slug/")
  async getAllProjects(
    @Param("slug") organizationSlug: OrganizationSlug,
    @Request() req: any
  ): Promise<ProjectTemplate[]> {
    const userId = req.user.id;
    const org = await this.getOrg(organizationSlug);
    const userIsAdmin = org && org.admin.id === userId;
    if (userIsAdmin) {
      return this.service.findAdminOrgProjects(organizationSlug);
    } else {
      throw new BadRequestException(`User is not an admin for organization ${organizationSlug}`);
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get("featured/:slug")
  async getFeaturedProjects(
    @Param("slug") organizationSlug: OrganizationSlug
  ): Promise<ProjectTemplate[]> {
    return this.getOrgFeaturedProjects(organizationSlug);
  }
}
