import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

import { HealthcheckController } from "./healthcheck.controller";

@Module({
  controllers: [HealthcheckController],
  imports: [TerminusModule]
})
export class HealthCheckModule {}
