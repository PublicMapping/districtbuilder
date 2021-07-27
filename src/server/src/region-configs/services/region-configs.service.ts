import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CrudRequest, GetManyDefaultResponse, ParsedRequest } from "@nestjsx/crud";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { groupBy, last, map, sortBy } from "lodash";
import { Repository } from "typeorm";

import { RegionConfig } from "../entities/region-config.entity";

@Injectable()
export class RegionConfigsService extends TypeOrmCrudService<RegionConfig> {
  constructor(@InjectRepository(RegionConfig) repo: Repository<RegionConfig>) {
    super(repo);
  }
}
