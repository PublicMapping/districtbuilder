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
    // If timeout is 'undefined' we'll use the default of 1000ms
    const timeout = process.env.TYPEORM_HEALTH_CHECK_TIMEOUT
      ? Number(process.env.TYPEORM_HEALTH_CHECK_TIMEOUT)
      : undefined;
    return this.health.check([
      async () => this.db.pingCheck("database", { timeout }),
      () => this.topoLoaded.isHealthy("topology")
    ]);
  }
}
