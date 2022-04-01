import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator
} from "@nestjs/terminus";
import os from "os";

import TopologyLoadedIndicator from "./topology-loaded.indicator";

@Controller("healthcheck")
export class HealthcheckController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly topoLoaded: TopologyLoadedIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck(): Promise<HealthCheckResult> {
    // If timeout is 'undefined' we'll use the default of 1000ms
    const timeout = process.env.TYPEORM_HEALTH_CHECK_TIMEOUT
      ? Number(process.env.TYPEORM_HEALTH_CHECK_TIMEOUT)
      : undefined;
    const maxRss = os.totalmem() * 0.95;
    return this.health.check([
      () => this.db.pingCheck("database", { timeout }),
      () => this.topoLoaded.isHealthy("topology"),
      () => this.memory.checkRSS("memory", maxRss)
    ]);
  }
}
