import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import {
  Crud,
  CrudAuth,
  CrudController,
  CrudRequest,
  CrudRequestInterceptor,
  Override,
  ParsedBody,
  ParsedRequest
} from "@nestjsx/crud";
import { FeatureCollection } from "geojson";

import { MakeDistrictsErrors } from "../../../../shared/constants";
import { ProjectId } from "../../../../shared/entities";
import { TopologyService } from "../../districts/services/topology.service";

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
    only: ["createOneBase", "getManyBase", "getOneBase", "updateOneBase"]
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
  get base(): CrudController<Project> {
    return this;
  }
  private readonly logger = new Logger(ProjectsController.name);
  constructor(public service: ProjectsService, public topologyService: TopologyService) {}

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

  @UseInterceptors(CrudRequestInterceptor)
  @Get(":id/export/geojson")
  async exportGeoJSON(
    @ParsedRequest() req: CrudRequest,
    @Param("id") projectId: ProjectId
  ): Promise<FeatureCollection> {
    if (!this.base.getOneBase) {
      this.logger.error("Routes misconfigured. Missing `getOneBase` route");
      throw new InternalServerErrorException();
    }
    const project = await this.base.getOneBase(req);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    const geoCollection = await this.topologyService.get(project.regionConfig.s3URI);
    if (!geoCollection) {
      throw new NotFoundException(
        `Topology ${project.regionConfig.s3URI} not found`,
        MakeDistrictsErrors.TOPOLOGY_NOT_FOUND
      );
    }
    const geojson = geoCollection.merge({ districts: project.districtsDefinition });
    if (geojson === null) {
      throw new BadRequestException(
        "District definition is invalid",
        MakeDistrictsErrors.INVALID_DEFINITION
      );
    }
    return geojson;
  }
}
