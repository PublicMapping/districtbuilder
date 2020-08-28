import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegionConfigsController } from "./controllers/region-configs.controller";
import { RegionConfig } from "./entities/region-config.entity";
import { RegionConfigsService } from "./services/region-configs.service";

@Module({
  imports: [TypeOrmModule.forFeature([RegionConfig])],
  controllers: [RegionConfigsController],
  providers: [RegionConfigsService],
  exports: [RegionConfigsService, TypeOrmModule]
})
export class RegionConfigsModule {}
