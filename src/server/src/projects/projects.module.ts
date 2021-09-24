import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ChambersModule } from "../chambers/chambers.module";
import { DistrictsModule } from "../districts/districts.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { RegionConfigsModule } from "../region-configs/region-configs.module";
import { UsersModule } from "../users/users.module";

import { GlobalProjectsController } from "./controllers/globalProjects.controller";
import { ProjectsController } from "./controllers/projects.controller";
import { Project } from "./entities/project.entity";
import { ProjectsService } from "./services/projects.service";
import { CrosswalkService } from "./services/crosswalk.service";
import { ProjectTemplatesModule } from "../project-templates/project-templates.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    DistrictsModule,
    RegionConfigsModule,
    ChambersModule,
    OrganizationsModule,
    ProjectTemplatesModule,
    UsersModule
  ],
  controllers: [ProjectsController, GlobalProjectsController],
  providers: [CrosswalkService, ProjectsService],
  exports: [CrosswalkService, ProjectsService]
})
export class ProjectsModule {}
