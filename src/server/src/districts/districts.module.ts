import { Module } from "@nestjs/common";

import { DistrictsController } from "./controllers/districts.controller";
import { TopologyService } from "./services/topology.service";

@Module({
  controllers: [DistrictsController],
  providers: [TopologyService]
})
export class DistrictsModule {}
