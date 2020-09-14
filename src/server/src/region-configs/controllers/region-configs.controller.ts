import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Logger,
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
import { QueryFailedError } from "typeorm";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RegionConfig } from "../entities/region-config.entity";
import { RegionConfigsService } from "../services/region-configs.service";

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
@UseGuards(JwtAuthGuard)
@Controller("api/region-configs")
export class RegionConfigsController implements CrudController<RegionConfig> {
  get base(): CrudController<RegionConfig> {
    return this;
  }
  private readonly logger = new Logger(RegionConfigsController.name);
  constructor(public service: RegionConfigsService) {}

  @Override()
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
}
