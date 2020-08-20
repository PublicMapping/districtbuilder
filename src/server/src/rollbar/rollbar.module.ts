import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { RollbarService } from "./rollbar.service";
import { RollbarExceptionFilter } from "./rollbar-exception.filter";

@Module({
  providers: [
    RollbarService,
    {
      provide: APP_FILTER,
      useClass: RollbarExceptionFilter
    }
  ],
  exports: [RollbarService]
})
export class RollbarModule {}
