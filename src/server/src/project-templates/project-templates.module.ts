import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RegionConfigsModule } from "../region-configs/region-configs.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { ProjectTemplatesController } from "./controllers/project-templates.controller";
import { ProjectTemplatesService } from "./services/project-templates.service";
import { ProjectTemplate } from "./entities/project-template.entity";
import { DistrictsModule } from "../districts/districts.module";
import { ProjectsModule } from "../projects/projects.module";
import { ReferenceLayersModule } from "../reference-layers/reference-layers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectTemplate]),
    DistrictsModule,
    RegionConfigsModule,
    OrganizationsModule,
    forwardRef(() => ProjectsModule),
    forwardRef(() => ReferenceLayersModule)
  ],
  controllers: [ProjectTemplatesController],
  providers: [ProjectTemplatesService],
  exports: [ProjectTemplatesService]
})
export class ProjectTemplatesModule {}
