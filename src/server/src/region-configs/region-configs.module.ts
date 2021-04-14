import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegionConfigsController } from "./controllers/region-configs.controller";
import { RegionConfig } from "./entities/region-config.entity";
import { RegionConfigsService } from "./services/region-configs.service";
import { DistrictsModule } from "../districts/districts.module";

@Module({
  imports: [TypeOrmModule.forFeature([RegionConfig]), forwardRef(() => DistrictsModule)],
  controllers: [RegionConfigsController],
  providers: [RegionConfigsService],
  exports: [RegionConfigsService, TypeOrmModule]
})
export class RegionConfigsModule {}
