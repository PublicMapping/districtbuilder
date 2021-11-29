import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Chamber } from "./entities/chamber.entity";
import { ChambersService } from "./services/chambers";

@Module({
  imports: [TypeOrmModule.forFeature([Chamber])],
  controllers: [],
  providers: [ChambersService],
  exports: [ChambersService, TypeOrmModule]
})
export class ChambersModule {}
