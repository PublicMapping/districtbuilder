import {
  BadRequestException,
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  Get,
  NotFoundException,
  Body,
  Param
} from "@nestjs/common";

import { LoginErrors } from "../../../../shared/constants";

import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/users.service";

import { LoginDto } from "../entities/login.dto";
import { RegisterDto } from "../entities/register.dto";
import { AuthService } from "../services/auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService
  ) {}

  @Post("email/login")
  @HttpCode(HttpStatus.OK)
  public async login(@Body() login: LoginDto): Promise<User> {
    let userOrError;
    try {
      userOrError = await this.authService.validateLogin(login.email, login.password);
    } catch (error) {
      throw new BadRequestException(LoginErrors.ERROR, error);
    }

    if (userOrError === null || userOrError === LoginErrors.NOT_FOUND) {
      throw new NotFoundException(LoginErrors.NOT_FOUND, `Email ${login.email} not found`);
    } else if (userOrError === LoginErrors.INVALID_PASSWORD) {
      throw new BadRequestException(LoginErrors.INVALID_PASSWORD, "Invalid password");
    } else if (userOrError === LoginErrors.ERROR) {
      throw new BadRequestException(LoginErrors.ERROR);
    }

    return userOrError;
  }
}
