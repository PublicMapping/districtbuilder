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
  GetManyDefaultResponse,
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
import { RegionConfigsService } from "../../region-configs/services/region-configs.service";

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
      },
      user: {
        allow: ["id"],
        eager: true
      }
    }
  },
  routes: {
    only: ["createOneBase", "getManyBase", "getOneBase", "updateOneBase"]
  }
})
@CrudAuth({
  filter: (req: any) => {
    // Filter to user's projects for all update requests and for full project
    // list. Unauthenticated access is allowed for individual projects
    if (req.method !== "GET" || req.url === "/api/projects") {
      const user = req.user as User;
      return {
        user_id: user ? user.id : undefined
      };
    }
  },
  persist: (req: any) => {
    const user = req.user as User;
    return {
      userId: user ? user.id : undefined
    };
  }
})
@Controller("api/projects")
// @ts-ignore
export class ProjectsController implements CrudController<Project> {
  get base(): CrudController<Project> {
    return this;
  }
  private readonly logger = new Logger(ProjectsController.name);
  constructor(
    public service: ProjectsService,
    public topologyService: TopologyService,
    private readonly regionConfigService: RegionConfigsService
  ) {}

  // Overriden to add JwtAuthGuard
  @Override()
  @UseGuards(JwtAuthGuard)
  getMany(@ParsedRequest() req: CrudRequest): Promise<GetManyDefaultResponse<Project> | Project[]> {
    if (!this.base.getManyBase) {
      this.logger.error("Routes misconfigured. Missing `getManyBase` route");
      throw new InternalServerErrorException();
    }
    return this.base.getManyBase(req);
  }

  // Overriden to add JwtAuthGuard
  @Override()
  @UseGuards(JwtAuthGuard)
  updateOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: Project) {
    if (!this.base.updateOneBase) {
      this.logger.error("Routes misconfigured. Missing `updateOneBase` route");
      throw new InternalServerErrorException();
    }
    return this.base.updateOneBase(req, dto);
  }

  @Override()
  @UseGuards(JwtAuthGuard)
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateProjectDto
  ): Promise<Project> {
    try {
      const regionConfig = await this.regionConfigService.findOne({ id: dto.regionConfig.id });
      if (!regionConfig) {
        throw new NotFoundException(`Unable to find region config: ${dto.regionConfig.id}`);
      }

      const geoCollection = await this.topologyService.get(regionConfig.s3URI);
      if (!geoCollection) {
        throw new NotFoundException(
          `Topology ${regionConfig.s3URI} not found`,
          MakeDistrictsErrors.TOPOLOGY_NOT_FOUND
        );
      }

      return await this.service.createOne(req, {
        ...dto,
        districtsDefinition: new Array(geoCollection.hierarchy.length).fill(0),
        user: req.parsed.authPersist.userId
      });
    } catch (error) {
      this.logger.error(`Error creating project: ${error}`);
      throw new InternalServerErrorException();
    }
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
    const geojson = geoCollection.merge(
      { districts: project.districtsDefinition },
      project.numberOfDistricts
    );
    if (geojson === null) {
      this.logger.error(`Invalid districts definition for project ${projectId}`);
      throw new BadRequestException(
        "District definition is invalid",
        MakeDistrictsErrors.INVALID_DEFINITION
      );
    }
    return geojson;
  }
}
