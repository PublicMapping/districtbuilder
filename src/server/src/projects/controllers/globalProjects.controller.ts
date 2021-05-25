import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import {
  Crud,
  CrudAuth,
  CrudController,
  CrudRequest,
  CrudRequestInterceptor,
  GetManyDefaultResponse,
  Override,
  ParsedBody,
  ParsedRequest
} from "@nestjsx/crud";
import stringify from "csv-stringify/lib/sync";
import { Response } from "express";
import { convert } from "geojson2shp";
import * as _ from "lodash";
import { GeometryCollection } from "topojson-specification";
import isUUID from "validator/lib/isUUID";

import { MakeDistrictsErrors } from "../../../../shared/constants";
import {
  DistrictsDefinition,
  GeoUnitHierarchy,
  ProjectId,
  PublicUserProperties
} from "../../../../shared/entities";
import { ProjectVisibility } from "../../../../shared/constants";
import { GeoUnitTopology } from "../../districts/entities/geo-unit-topology.entity";
import { TopologyService } from "../../districts/services/topology.service";

import { JwtAuthGuard, OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RegionConfig } from "../../region-configs/entities/region-config.entity";
import { Project } from "../entities/project.entity";
import { ProjectsService } from "../services/projects.service";

import { UpdateProjectDto } from "../entities/update-project.dto";
import { Pagination } from 'nestjs-typeorm-paginate';


@Crud({
  model: {
    type: Project
  },
  params: {
    // Add pagination here
    // https://www.npmjs.com/package/nestjs-typeorm-paginate
  },
  dto: {
    update: UpdateProjectDto
  }
})
@Controller("api/globalProjects")
// @ts-ignore
export class GlobalProjectsController implements CrudController<Project> {
  get base(): CrudController<Project> {
    return this;
  }
  constructor(
    public service: ProjectsService
  ) {}

  @Get()
  async getAllGlobalProjects(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ): Promise<Pagination<Project>> {
    return this.service.findAllPublishedProjectsPaginated({page, limit});
  }
}
