import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RegionConfigsModule } from "../region-configs/region-configs.module";
import { ProjectTemplate } from "./entities/project-template.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTemplate]), RegionConfigsModule]
})
export class ProjectTemplatesModule {}
