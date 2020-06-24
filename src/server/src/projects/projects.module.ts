import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TopologyService } from "../districts/services/topology.service";
import { RegionConfig } from "../region-configs/entities/region-config.entity";
import { ProjectsController } from "./controllers/projects.controller";
import { Project } from "./entities/project.entity";
import { ProjectsService } from "./services/projects.service";
import { RegionConfigsService } from "../region-configs/services/region-configs.service";

@Module({
  imports: [TypeOrmModule.forFeature([Project]), TypeOrmModule.forFeature([RegionConfig])],
  controllers: [ProjectsController],
  providers: [ProjectsService, RegionConfigsService, TopologyService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
