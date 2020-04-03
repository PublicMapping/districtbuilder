import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./controllers/auth.controller";
import { EmailVerification } from "./entities/email-verification.entity";
import { AuthService } from "./services/auth.service";

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([EmailVerification])],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
