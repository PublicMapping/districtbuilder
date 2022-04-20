import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { RollbarService } from "./rollbar.service";
import { RollbarExceptionFilter } from "./rollbar-exception.filter";

@Module({
  providers: [
    RollbarService,
    {
      // Load Rollbar filter as a global filter to catch all unhandled exceptions
      provide: APP_FILTER,
      useClass: RollbarExceptionFilter
    }
  ],
  exports: [RollbarService]
})
export class RollbarModule {}
