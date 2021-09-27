import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReferenceLayersController } from "./controllers/reference-layers.controller";
import { ReferenceLayer } from "./entities/reference-layer.entity";
import { ReferenceLayersService } from "./services/reference-layers.service";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [TypeOrmModule.forFeature([ReferenceLayer]), forwardRef(() => ProjectsModule)],
  controllers: [ReferenceLayersController],
  providers: [ReferenceLayersService],
  exports: [ReferenceLayersService, TypeOrmModule]
})
export class ReferenceLayersModule {}
