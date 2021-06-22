import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Query,
  UseGuards
} from "@nestjs/common";
import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedBody,
  ParsedRequest
} from "@nestjsx/crud";
import { OptionalJwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TopologyService } from "../../districts/services/topology.service";
import { QueryFailedError } from "typeorm";
import { RegionLookupProperties } from "../../../../shared/entities";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RegionConfig } from "../entities/region-config.entity";
import { RegionConfigsService } from "../services/region-configs.service";
import * as _ from "lodash";

@Crud({
  model: {
    type: RegionConfig
  },
  query: {
    join: {
      chambers: {
        persist: ["regionConfig"],
        eager: true
      }
    }
  },
  routes: {
    only: ["createOneBase", "getManyBase"]
  }
})
@Controller("api/region-configs")
// @ts-ignore
export class RegionConfigsController implements CrudController<RegionConfig> {
  get base(): CrudController<RegionConfig> {
    return this;
  }
  private readonly logger = new Logger(RegionConfigsController.name);
  constructor(public service: RegionConfigsService, public topologyService: TopologyService) {}

  @Override()
  @UseGuards(JwtAuthGuard)
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: RegionConfig
  ): Promise<RegionConfig> {
    if (!this.base.createOneBase) {
      this.logger.error("Routes misconfigured. Missing `createOneBase` route");
      throw new InternalServerErrorException();
    }
    try {
      return await this.base.createOneBase(req, dto);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(
          "The following fields are required: name, countryCode, regionCode, s3URI. s3URI must be unique"
        );
      } else {
        this.logger.error(`Error creating region config: ${error}`);
        throw new InternalServerErrorException();
      }
    }
  }

  @Get(":regionId/properties/:geounit")
  @UseGuards(OptionalJwtAuthGuard)
  async getRegionProperties(
    @Param("regionId") regionId: string,
    @Param("geounit") geounit: string,
    @Query("fields") fields: string[]
  ): Promise<readonly RegionLookupProperties[]> {
    const regionConfig = await this.service.findOne({ id: regionId });

    const geoCollection = regionConfig && (await this.topologyService.get(regionConfig.s3URI));
    if (!geoCollection) {
      throw new InternalServerErrorException();
    }
    const props = geoCollection.topologyProperties[geounit];
    return fields ? props.map(f => _.pick(f, fields)) : props;
  }
}
