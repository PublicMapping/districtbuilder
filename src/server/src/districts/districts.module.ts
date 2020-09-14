import { Module } from "@nestjs/common";

import { RegionConfigsModule } from "../region-configs/region-configs.module";
import { TopologyService } from "./services/topology.service";

@Module({
  imports: [RegionConfigsModule],
  providers: [TopologyService],
  exports: [TopologyService]
})
export class DistrictsModule {}
