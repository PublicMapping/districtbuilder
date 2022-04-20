// Not sure why, but eslint thinks these decorators are unused
/* eslint-disable */
import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
  DefaultValuePipe
} from "@nestjs/common";
/* eslint-enable */

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
    @Query("completed", new DefaultValuePipe(false), ParseBoolPipe) completed = false,
    @Query("region", new DefaultValuePipe(undefined)) region = undefined
  ): Promise<Pagination<Project>> {
    return this.service.findAllPublishedProjectsPaginated({ page, limit, completed, region });
  }
}
