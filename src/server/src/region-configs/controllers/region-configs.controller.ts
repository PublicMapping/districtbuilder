import { Controller, UseGuards } from "@nestjs/common";
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
  constructor(public service: RegionConfigsService) {}

  get base(): CrudController<RegionConfig> {
    return this;
  }

  @Override()
  async getMany(
    @ParsedRequest() req: CrudRequest
  ): Promise<GetManyDefaultResponse<RegionConfig> | readonly RegionConfig[]> {
    if (this.base.getManyBase) {
      const regionConfigs = await this.base.getManyBase(req);
      if (!("length" in regionConfigs)) {
        return regionConfigs;
      }
      return map(
        groupBy(regionConfigs, (value: RegionConfig) => [
          value.countryCode,
          value.regionCode,
          value.name
        ]),
        (values: RegionConfig[]) => last(sortBy(values, "version")) as RegionConfig
      );
    } else {
      return [];
    }
  }
}
