import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { AuthService } from "./services/auth.service";

@Module({
  imports: [UsersModule],
  providers: [AuthService]
})
export class AuthModule {}
