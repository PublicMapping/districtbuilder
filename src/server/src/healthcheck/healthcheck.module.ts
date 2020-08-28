import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

import { DistrictsModule } from "../districts/districts.module";
import { HealthcheckController } from "./healthcheck.controller";
import TopologyLoadedIndicator from "./topology-loaded.indicator";

@Module({
  controllers: [HealthcheckController],
  imports: [TerminusModule, DistrictsModule],
  providers: [TopologyLoadedIndicator]
})
export class HealthCheckModule {}
