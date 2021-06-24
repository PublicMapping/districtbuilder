// eslint-disable-next-line
import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
  DefaultValuePipe
} from "@nestjs/common";
import { Project } from "../entities/project.entity";
import { ProjectsService } from "../services/projects.service";

import { Pagination } from "nestjs-typeorm-paginate";

@Controller("api/globalProjects")
export class GlobalProjectsController {
  constructor(public service: ProjectsService) {}

  @Get()
  async getAllGlobalProjects(
    @Query("page", ParseIntPipe) page = 1,
    @Query("limit", ParseIntPipe) limit = 10,
    @Query("completed", new DefaultValuePipe(false), ParseBoolPipe) completed = false
  ): Promise<Pagination<Project>> {
    return this.service.findAllPublishedProjectsPaginated({ page, limit, completed });
  }
}
