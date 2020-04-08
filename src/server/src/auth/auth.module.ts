import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";

import { UsersModule } from "../users/users.module";
import { AuthController } from "./controllers/auth.controller";
import { EmailVerification } from "./entities/email-verification.entity";
import { AuthService } from "./services/auth.service";

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([EmailVerification]),
    JwtModule.register({
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION_IN_MS
      },
      secret: process.env.JWT_SECRET
    })
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
