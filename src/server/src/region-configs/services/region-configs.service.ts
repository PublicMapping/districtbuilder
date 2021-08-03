import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Repository } from "typeorm";

import { RegionConfig } from "../entities/region-config.entity";

@Injectable()
export class RegionConfigsService extends TypeOrmCrudService<RegionConfig> {
  constructor(@InjectRepository(RegionConfig) repo: Repository<RegionConfig>) {
    super(repo);
  }
}
