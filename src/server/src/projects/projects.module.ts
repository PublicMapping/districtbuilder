import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DistrictsModule } from "../districts/districts.module";
import { RegionConfigsModule } from "../region-configs/region-configs.module";
import { ProjectsController } from "./controllers/projects.controller";
import { Project } from "./entities/project.entity";
import { ProjectsService } from "./services/projects.service";

@Module({
  imports: [TypeOrmModule.forFeature([Project]), DistrictsModule, RegionConfigsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
