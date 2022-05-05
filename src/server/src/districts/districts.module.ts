import { Module } from "@nestjs/common";

import { RegionConfigsModule } from "../region-configs/region-configs.module";
import { DistrictsController } from "./controllers/districts.controller";
import { TopologyService } from "./services/topology.service";
import { WorkerPoolService } from "./services/worker-pool.service";

@Module({
  controllers: [DistrictsController],
  imports: [RegionConfigsModule],
  providers: [TopologyService, WorkerPoolService],
  exports: [TopologyService]
})
export class DistrictsModule {}
