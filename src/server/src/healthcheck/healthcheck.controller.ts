import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator
} from "@nestjs/terminus";

import TopologyLoadedIndicator from "./topology-loaded.indicator";

@Controller("healthcheck")
export class HealthcheckController {
  constructor(
    private health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private topoLoaded: TopologyLoadedIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => this.db.pingCheck("database"),
      () => this.topoLoaded.isHealthy("topology")
    ]);
  }
}
