import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";

import { JwtStrategy } from "./jwt.strategy";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./controllers/auth.controller";
import { EmailVerification } from "./entities/email-verification.entity";
import { AuthService } from "./services/auth.service";

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([EmailVerification]),
    PassportModule,
    JwtModule.register({
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION_IN_MS
      },
      secret: process.env.JWT_SECRET
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy]
})
export class AuthModule {}
