import { Controller, InternalServerErrorException, Logger, UseGuards } from "@nestjs/common";
import {
  Crud,
  CrudController,
  CrudRequest,
  GetManyDefaultResponse,
  Override,
  ParsedRequest
} from "@nestjsx/crud";
import { groupBy, last, map, sortBy } from "lodash";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RegionConfig } from "../entities/region-config.entity";
import { RegionConfigsService } from "../services/region-configs.service";

@Crud({
  model: {
    type: RegionConfig
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
  async getMany(
    @ParsedRequest() req: CrudRequest
  ): Promise<GetManyDefaultResponse<RegionConfig> | readonly RegionConfig[]> {
    if (!this.base.getManyBase) {
      this.logger.error("Routes misconfigured. Missing `getManyBase` route");
      throw new InternalServerErrorException();
    }
    const regionConfigs = await this.base.getManyBase(req);
    if (!("length" in regionConfigs)) {
      return regionConfigs;
    }
    return this.getOnlyLatestRegionConfigs(regionConfigs);
  }

  /*
   * Only return latest version of each region config.
   */
  private getOnlyLatestRegionConfigs(
    regionConfigs: readonly RegionConfig[]
  ): readonly RegionConfig[] {
    return map(
      groupBy(regionConfigs, (regionConfig: RegionConfig) => [
        regionConfig.countryCode,
        regionConfig.regionCode,
        regionConfig.name
      ]),
      (regionConfigs: RegionConfig[]) => last(sortBy(regionConfigs, "version")) as RegionConfig
    );
  }
}
