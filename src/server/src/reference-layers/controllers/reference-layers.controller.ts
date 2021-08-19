import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Request,
  Param,
  NotFoundException,
  UseInterceptors,
  UseGuards
} from "@nestjs/common";
import { IReferenceLayer } from "../../../../shared/entities";

import {
  Crud,
  CrudController,
  CrudRequest,
  CrudRequestInterceptor,
  Override,
  ParsedBody,
  ParsedRequest
} from "@nestjsx/crud";
import isUUID from "validator/lib/isUUID";
import { OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { QueryFailedError } from "typeorm";
import { ProjectId, ReferenceLayerId } from "../../../../shared/entities";
import { User } from "../../users/entities/user.entity";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ReferenceLayer } from "../entities/reference-layer.entity";
import { ReferenceLayersService } from "../services/reference-layers.service";
import { ProjectsService } from "../../projects/services/projects.service";
import { CreateReferenceLayerDto } from "../entities/create-reference-layer.dto";

@Crud({
  model: {
    type: ReferenceLayer
  },
  routes: {
    only: ["createOneBase", "getOneBase"]
  }
})
@Controller("api/reference-layer")
// @ts-ignore
export class ReferenceLayersController implements CrudController<ReferenceLayer> {
  get base(): CrudController<ReferenceLayer> {
    return this;
  }
  private readonly logger = new Logger(ReferenceLayer.name);
  constructor(public service: ReferenceLayersService, public projectsService: ProjectsService) {}

  @Override()
  @UseGuards(JwtAuthGuard)
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: CreateReferenceLayerDto
  ): Promise<ReferenceLayer> {
    if (!this.base.createOneBase) {
      this.logger.error("Routes misconfigured. Missing `createOneBase` route");
      throw new InternalServerErrorException();
    }
    try {
      // @ts-ignore
      return await this.service.createOne(req, dto);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(
          "The following fields are required: name, project, layer_type, layer"
        );
      } else {
        this.logger.error(`Error creating reference layer: ${error}`);
        throw new InternalServerErrorException();
      }
    }
  }

  // Overriden to add OptionalJwtAuthGuard, and possibly return a read-only view
  @Override()
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(
    @Param("id") id: ReferenceLayerId,
    @ParsedRequest() req: CrudRequest
  ): Promise<ReferenceLayer> {
    return this.getReferenceLayer(req, id);
  }

  // Helper for obtaining a project for a given project request, throws exception if not found
  async getReferenceLayer(req: CrudRequest, id: ReferenceLayerId): Promise<ReferenceLayer> {
    if (!this.base.getOneBase) {
      this.logger.error("Routes misconfigured. Missing `getOneBase` route");
      throw new InternalServerErrorException();
    }
    if (!isUUID(id)) {
      throw new NotFoundException(`Layer ID ${id} is not a valid UUID`);
    }
    const referenceLayer = await this.base.getOneBase(req);
    if (!referenceLayer) {
      throw new NotFoundException(`Layer ${id} not found`);
    }
    return referenceLayer;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CrudRequestInterceptor)
  @Get("project/:projectId/")
  async getProjectReferenceLayers(
    @Request() req: any,
    @Param("projectId") projectId: ProjectId
  ): Promise<IReferenceLayer[]> {
    const user = req.user as User;
    const refLayers = await this.service.getProjectReferenceLayers(projectId, user?.id);
    return refLayers;
  }
}
