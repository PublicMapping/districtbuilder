import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CrudRequest, GetManyDefaultResponse, ParsedRequest } from "@nestjsx/crud";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { groupBy, last, map, sortBy } from "lodash";
import { Repository } from "typeorm";

import { RegionConfig } from "../entities/region-config.entity";

// eslint-disable functional/immutable-data
@Injectable()
export class RegionConfigsService extends TypeOrmCrudService<RegionConfig> {
  constructor(@InjectRepository(RegionConfig) repo: Repository<RegionConfig>) {
    super(repo);
  }

  async getMany(
    @ParsedRequest() req: CrudRequest
  ): Promise<GetManyDefaultResponse<RegionConfig> | RegionConfig[]> {
    const regionConfigs = await super.getMany(req);
    if (!("length" in regionConfigs)) {
      return regionConfigs;
    }
    return this.onlyLatestRegionConfigs(regionConfigs);
  }

  /*
   * Only return latest version of each region config.
   */
  private onlyLatestRegionConfigs(regionConfigs: RegionConfig[]): RegionConfig[] {
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
