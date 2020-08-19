import { Module } from "@nestjs/common";
import { RollbarService } from "./rollbar.service";

@Module({
  providers: [RollbarService],
  exports: [RollbarService]
})
export class RollbarModule {}
