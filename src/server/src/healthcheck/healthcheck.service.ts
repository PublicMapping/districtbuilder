import { Injectable } from "@nestjs/common";
import {
  TerminusEndpoint,
  TerminusModuleOptions,
  TerminusOptionsFactory,
  TypeOrmHealthIndicator
} from "@nestjs/terminus";

@Injectable()
export class HealthcheckService implements TerminusOptionsFactory {
  constructor(private readonly db: TypeOrmHealthIndicator) {}

  createTerminusOptions(): TerminusModuleOptions {
    const healthEndpoint: TerminusEndpoint = {
      url: "/healthcheck",
      healthIndicators: [async () => this.db.pingCheck("database")]
    };
    return {
      endpoints: [healthEndpoint]
    };
  }
}
