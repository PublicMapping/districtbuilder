import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator
} from "@nestjs/terminus";

@Controller("healthcheck")
export class HealthcheckController {
  constructor(private health: HealthCheckService, private readonly db: TypeOrmHealthIndicator) {}

  @Get()
  @HealthCheck()
  healthCheck(): Promise<HealthCheckResult> {
    return this.health.check([async () => this.db.pingCheck("database")]);
  }
}
