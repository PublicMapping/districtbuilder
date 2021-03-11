import { Controller, UseGuards, Param, Post, NotFoundException, Body, Get } from "@nestjs/common";

import { OrganizationSlug, UserId } from "../../../../shared/entities";
import { JoinOrganizationErrors } from "../../../../shared/constants";

import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";

import { Organization } from "../entities/organization.entity";
import { OrganizationUserDto } from "../entities/organizationUser.dto";
import { OrganizationsService } from "../services/organizations.service";

@Controller("api/organization")
export class OrganizationsController {
  constructor(public service: OrganizationsService, private readonly usersService: UsersService) {}

  async getOrg(organizationSlug: OrganizationSlug): Promise<Organization> {
    const org = await this.service.getOrgAndProjects(organizationSlug);
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
    return this.getOrg(slug);
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
