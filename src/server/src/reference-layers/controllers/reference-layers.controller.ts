import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  NotFoundException,
  UseInterceptors,
  UseGuards
} from "@nestjs/common";
import { IReferenceLayer } from "../../../../shared/entities";
import { FeatureCollection } from "geojson";

import {
  Crud,
  CrudController,
  CrudRequest,
  CrudRequestInterceptor,
  Override,
  ParsedBody,
  ParsedRequest,
  CrudAuth
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
import { ProjectVisibility } from "../../../../shared/constants";

@Crud({
  model: {
    type: ReferenceLayer
  },
  params: {
    id: {
      type: "string",
      primary: true,
      field: "id"
    },
    projectId: {
      type: "string",
      field: "id"
    }
  },
  query: {
    join: {
      project: {
        eager: true,
        select: false
      }
    }
  },
  routes: {
    only: ["createOneBase", "deleteOneBase", "getOneBase"]
  }
})
@CrudAuth({
  filter: (req: any) => {
    const user = req.user as User;
    // Filter to user's projects for all update requests
    if (req.method !== "GET") {
      return {
        "project.user_id": user ? user.id : undefined
      };
    } else {
      // Unauthenticated access is allowed for individual projects if they are
      // visible or published, and not archived.
      const publicallyVisible = [
        { "project.visibility": ProjectVisibility.Published },
        { "project.visibility": ProjectVisibility.Visible }
      ];
      const visibleFilter = user
        ? [
            // User created project
            { "project.user_id": user.id },
            // Or it's public
            ...publicallyVisible
          ]
        : publicallyVisible;
      return {
        $and: [
          {
            $or: visibleFilter
          },
          { "project.archived": false }
        ]
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
@Controller("api/reference-layer")
// @ts-ignore
export class ReferenceLayersController implements CrudController<ReferenceLayer> {
  get base(): CrudController<ReferenceLayer> {
    return this;
  }
  private readonly logger = new Logger(ReferenceLayer.name);
  constructor(public service: ReferenceLayersService, public projectsService: ProjectsService) {}

  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(OptionalJwtAuthGuard)
  @Get("project/:projectId")
  getProjectReferenceLayers(
    @ParsedRequest() req: CrudRequest,
    @Param("projectId") projectId: ProjectId
  ): Promise<IReferenceLayer[]> {
    const userId =
      typeof req.parsed.authPersist.userId === "string" ? req.parsed.authPersist.userId : undefined;
    return this.service.getPublicReferenceLayers(projectId, userId);
  }

  @UseInterceptors(CrudRequestInterceptor)
  @UseGuards(OptionalJwtAuthGuard)
  @Get(":id/geojson")
  async getGeojson(
    @Param("id") id: ReferenceLayerId,
    @ParsedRequest() req: CrudRequest
  ): Promise<FeatureCollection> {
    const refLayer = await this.getOne(id, req);
    return refLayer.layer;
  }

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
          "The following fields are required: name, project, layer_type, layer_color, layer"
        );
      } else {
        this.logger.error(`Error creating reference layer: ${error}`);
        throw new InternalServerErrorException();
      }
    }
  }

  @UseInterceptors(CrudRequestInterceptor)
  @Override()
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(
    @Param("id") id: ReferenceLayerId,
    @ParsedRequest() req: CrudRequest
  ): Promise<ReferenceLayer> {
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

  @UseInterceptors(CrudRequestInterceptor)
  @Override()
  @UseGuards(OptionalJwtAuthGuard)
  async deleteOne(
    @Param("id") id: ReferenceLayerId,
    @ParsedRequest() req: CrudRequest
  ): Promise<void | ReferenceLayer> {
    if (!this.base.deleteOneBase) {
      this.logger.error("Routes misconfigured. Missing `deleteOneBase` route");
      throw new InternalServerErrorException();
    }
    if (!isUUID(id)) {
      throw new NotFoundException(`Layer ID ${id} is not a valid UUID`);
    }
    return await this.base.deleteOneBase(req);
  }
}
