import { Controller, UseGuards } from "@nestjs/common";
import {
  Crud,
  CrudAuth,
  CrudController,
  CrudRequest,
  Override,
  ParsedBody,
  ParsedRequest
} from "@nestjsx/crud";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { User } from "../../users/entities/user.entity";
import { CreateProjectDto } from "../entities/project.dto";
import { Project } from "../entities/project.entity";
import { ProjectsService } from "../services/projects.service";

@Crud({
  model: {
    type: Project
  },
  params: {
    id: {
      type: "uuid",
      primary: true,
      field: "id"
    }
  },
  query: {
    join: {
      regionConfig: {
        eager: true
      }
    }
  },
  routes: {
    only: ["createOneBase", "getManyBase", "getOneBase"]
  }
})
@CrudAuth({
  property: "user",
  filter: (user: User) => {
    return {
      user_id: user ? user.id : undefined
    };
  },
  persist: (user: User) => {
    return {
      userId: user ? user.id : undefined
    };
  }
})
@UseGuards(JwtAuthGuard)
@Controller("api/projects")
// @ts-ignore
export class ProjectsController implements CrudController<Project> {
  constructor(public service: ProjectsService) {}

  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateProjectDto
  ): Promise<Project> {
    return await this.service.createOne(req, {
      ...dto,
      user: req.parsed.authPersist.userId
    });
  }
}
