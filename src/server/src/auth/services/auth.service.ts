import { Injectable } from "@nestjs/common";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";

import { LoginErrors } from "../../../../shared/constants";

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateLogin(email: string, pass: string): Promise<User | LoginErrors> {
    const user = await this.usersService.findOne({ email });
    if (!user) {
      return LoginErrors.NOT_FOUND;
    }

    if (await user.comparePassword(pass)) {
      // If we have increased our salt rounds since the user last logged in,
      // update their password hash
      if (user.passwordOutdated()) {
        await user.setPassword(pass);
        return await this.usersService.getRepository().save(user);
      }
      return user;
    }

    return LoginErrors.INVALID_PASSWORD;
  }
}
