import {
  Controller,
  UseGuards,
  Param,
  Post,
  NotFoundException,
  Body,
  Get,
  Request,
  UnauthorizedException
} from "@nestjs/common";

import { OrganizationSlug, UserId } from "../../../../shared/entities";
import { JoinOrganizationErrors } from "../../../../shared/constants";

import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";

import { Organization } from "../entities/organization.entity";
import { OrganizationUserDto } from "../entities/organizationUser.dto";
import { OrganizationsService } from "../services/organizations.service";
import stringify = require("csv-stringify/lib/sync");

@Controller("api/organization")
export class OrganizationsController {
  constructor(public service: OrganizationsService, private readonly usersService: UsersService) {}

  async getOrgAndTemplates(organizationSlug: OrganizationSlug): Promise<Organization> {
    const org = await this.service.getOrgAndProjectTemplates(organizationSlug);
    if (!org) {
      throw new NotFoundException(`Organization ${organizationSlug} not found`);
    }
    return org;
  }

  async getUserOrgsForRegion(regionCode: string, userId: string): Promise<Organization[]> {
    const orgs = await this.service.getUserOrgsForRegion(regionCode, userId);
    if (!orgs) {
      return [];
    }
    return orgs;
  }

  async getOrg(organizationSlug: OrganizationSlug): Promise<Organization> {
    const org = await this.service.findOne(
      { slug: organizationSlug },
      { join: { alias: "organization", leftJoinAndSelect: { admin: "organization.admin" } } }
    );
    if (!org) {
      throw new NotFoundException(`Organization ${organizationSlug} not found`);
    }
    return org;
  }

  async getUser(userId: UserId): Promise<User> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(
        `User ${userId} not found`,
        JoinOrganizationErrors.USER_NOT_FOUND
      );
    }
    return user;
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(":slug/")
  async getOne(@Param("slug") slug: OrganizationSlug): Promise<Organization> {
    return this.getOrgAndTemplates(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get("by_region/:regionCode")
  async getOrganizationsForRegion(
    @Param("regionCode") regionCode: string,
    @Request() req: any
  ): Promise<Organization[]> {
    return this.getUserOrgsForRegion(regionCode, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":slug/export/users-csv/")
  async exportUsers(@Param("slug") slug: OrganizationSlug, @Request() req: any): Promise<string> {
    const org = await this.getOrg(slug);
    if (org.admin.id !== req.user.id) {
      throw new UnauthorizedException(
        `User does not have admin privileges for organization: ${org.id}`
      );
    }
    const users = await this.usersService.getOrgUsers(slug);
    const rows = users.map(user => [user.id, user.name, user.email]);
    return stringify(rows, {
      header: true,
      columns: ["User-id", "Name", "Email"]
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(":slug/join/")
  async joinOrganization(
    @Param("slug") organizationSlug: OrganizationSlug,
    @Body() addUser: OrganizationUserDto
  ): Promise<void> {
    const org = await this.getOrg(organizationSlug);

    const user = await this.getUser(addUser.userId);

    const userInOrg = org.users.find(u => {
      return u.id === user.id;
    });

    if (!userInOrg) {
      // eslint-disable-next-line
      org.users = [...org.users, user];
      await this.service.save(org);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(":slug/leave/")
  async leaveOrganization(
    @Param("slug") organizationSlug: OrganizationSlug,
    @Body() leaveUser: OrganizationUserDto
  ): Promise<void> {
    const org = await this.getOrg(organizationSlug);
    const orgUsers = org.users.filter(u => {
      return u.id !== leaveUser.userId;
    });
    // eslint-disable-next-line
    org.users = [...orgUsers];
    await this.service.save(org);
  }
}
