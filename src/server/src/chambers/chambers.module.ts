import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Chamber } from "./entities/chamber.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Chamber])],
  controllers: [],
  providers: [],
  exports: []
})
export class ChambersModule {}
