import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./controllers/users.controller";
import { User } from "./entities/user.entity";
import { UsersService } from "./services/users.service";

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService]
})
export class UsersModule {}
