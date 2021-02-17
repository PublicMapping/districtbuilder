import { Controller, UseGuards, Param, Post, NotFoundException, Body } from "@nestjs/common";
import { Crud, CrudController } from "@nestjsx/crud";
import { IsNotEmpty } from "class-validator";

import { OrganizationSlug, PublicUserProperties, UserId } from "../../../../shared/entities";
import { JoinOrganizationErrors } from "../../../../shared/constants";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";

import { Organization } from "../entities/organization.entity";
import { OrganizationUserDto } from "../entities/organizationUser.dto";
import { OrganizationsService } from "../services/organizations.service";

export class AddUserToOrg {
  @IsNotEmpty({ message: "Please enter a name for your project" })
  userId: UserId;
}

@Crud({
  model: {
    type: Organization
  },
  routes: {
    only: ["getOneBase"]
  },
  query: {
    join: {
      projectTemplates: {
        eager: true
      },
      "projectTemplates.regionConfig": {
        eager: true
      }
    }
  },
  params: {
    slug: {
      field: "slug",
      type: "string",
      primary: true
    }
  },
  query: {
    join: {
      users: {
        allow: ["id", "name"] as PublicUserProperties[],
        eager: true
      }
    }
  }
})
@Controller("api/organization")
// @ts-ignore
export class OrganizationsController implements CrudController<Organization> {
  constructor(public service: OrganizationsService, private readonly usersService: UsersService) {}

  async getOrg(organizationSlug: OrganizationSlug): Promise<Organization> {
    const org = await this.service.findOne({ slug: organizationSlug });
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
