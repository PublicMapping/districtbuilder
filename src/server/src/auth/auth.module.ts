import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./controllers/auth.controller";
import { EmailVerification } from "./entities/email-verification.entity";
import { AuthService } from "./services/auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { OrganizationsModule } from "../organizations/organizations.module";

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([EmailVerification]),
    PassportModule,
    OrganizationsModule,
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
