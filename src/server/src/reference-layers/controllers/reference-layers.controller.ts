import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  UploadedFile,
  Post,
  UseInterceptors,
  NotFoundException,
  UseGuards
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";
import csvParse from "csv-parse";
import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedBody,
  ParsedRequest
} from "@nestjsx/crud";
import isUUID from "validator/lib/isUUID";
import { OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { QueryFailedError } from "typeorm";
import { ProjectId, ReferenceLayerId } from "../../../../shared/entities";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  ReferenceLayer,
  ReferenceLayerGeojson,
  ReferenceLayerProperties
} from "../entities/reference-layer.entity";
import { ReferenceLayersService } from "../services/reference-layers.service";
import { ProjectsService } from "../../projects/services/projects.service";
import { FeatureCollection, Geometry, Feature } from "geojson";
import { CreateReferenceLayerDto } from "../entities/create-reference-layer.dto";

@Crud({
  model: {
    type: ReferenceLayer
  },
  query: {
    filter: {
      archived: false
    }
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

  @UseInterceptors(FileInterceptor("file"))
  @UseGuards(JwtAuthGuard)
  @Post("import/csv")
  async importReferenceLayerCSV(
    @UploadedFile() file: Express.Multer.File
  ): Promise<ReferenceLayerGeojson> {
    /* eslint-disable */
    const parser = csvParse(file.buffer, { fromLine: 1, columns: true });
    let geojson: FeatureCollection<Geometry, ReferenceLayerProperties> = {
      type: "FeatureCollection",
      features: []
    };
    // Seemingly the simplest way of getting all the records into an array is to iterate in a for-loop :(
    for await (const record of parser) {
      let recTransformed: Feature<Geometry, ReferenceLayerProperties> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: []
        }
      };
      recTransformed.properties = record;
      if (record.lat && record.lon) {
        // @ts-ignore
        recTransformed.geometry.coordinates = [record.lon, record.lat];
      } else if (record.latitude && record.longitude) {
        // @ts-ignore
        recTransformed.geometry.coordinates = [record.longitude, record.latitude];
      }

      geojson.features.push(recTransformed);
    }

    /* eslint-enable */
    return geojson;
  }

  @UseInterceptors(FileInterceptor("file"))
  @UseGuards(JwtAuthGuard)
  @Post("import/geojson")
  async importReferenceLayerGeojson(
    @UploadedFile() file: Express.Multer.File
  ): Promise<ReferenceLayerGeojson> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await JSON.parse(file.buffer.toString());
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
  @Get("project/:projectId/")
  async getProjectReferenceLayers(
    @Param("projectId") projectId: ProjectId
  ): Promise<ReferenceLayer[]> {
    const refLayers = await this.service.getProjectReferenceLayers(projectId);
    return refLayers;
  }
}
