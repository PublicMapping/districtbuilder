import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes";
import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  NotFoundException,
  Param,
  Post
} from "@nestjs/common";

import {
  LoginErrors,
  RegisterResponse,
  ResendResponse,
  VerifyEmailErrors
} from "../../../../shared/constants";

import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";

import { LoginDto } from "../entities/login.dto";
import { RegisterDto } from "../entities/register.dto";
import { AuthService } from "../services/auth.service";

/*
 * Authentication service that handles logins, account activiation and
 * password maintenance.
 *
 * Pay careful attention when modifying this module to not unintentionally log
 * any passwords or hashes through stack traces or generated error messages.
 */
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService
  ) {}

  @Post("email/login")
  public async login(@Body() login: LoginDto): Promise<User> {
    let userOrError;
    try {
      userOrError = await this.authService.validateLogin(
        login.email,
        login.password
      );
    } catch (error) {
      // Intentionally not logging errors as they may contain passwords
      throw new BadRequestException(LoginErrors.ERROR);
    }

    if (userOrError === null || userOrError === LoginErrors.NOT_FOUND) {
      throw new NotFoundException(
        LoginErrors[LoginErrors.NOT_FOUND],
        `Email ${login.email} not found`
      );
    } else if (userOrError === LoginErrors.INVALID_PASSWORD) {
      throw new BadRequestException(
        LoginErrors[LoginErrors.INVALID_PASSWORD],
        "Invalid password"
      );
    } else if (userOrError === LoginErrors.ERROR) {
      throw new BadRequestException(LoginErrors[LoginErrors.ERROR]);
    }

    // TODO: return JWT instead of user
    return userOrError;
  }

  @Post("email/register")
  async register(@Body() registerDto: RegisterDto): Promise<string> {
    try {
      const newUser = await this.userService.create(registerDto);
      await this.authService.sendVerificationEmail(newUser);
    } catch (error) {
      if (
        error.name === "QueryFailedError" &&
        error.code === PG_UNIQUE_VIOLATION
      ) {
        throw new BadRequestException(
          RegisterResponse[RegisterResponse.DUPLICATE],
          `User with email '${registerDto.email}' already exists`
        );
      }
      // Intentionally not logging errors as they may contain passwords
      throw new BadRequestException(RegisterResponse[RegisterResponse.ERROR]);
    }
    return RegisterResponse[RegisterResponse.SUCCESS];
  }

  @Post("email/verify/:token")
  public async verifyEmail(@Param("token") token: string): Promise<User> {
    try {
      const verifiedUser = await this.authService.verifyEmail(token);
      if (verifiedUser === undefined) {
        throw new NotFoundException(
          VerifyEmailErrors[VerifyEmailErrors.NOT_FOUND],
          "Email or user not found for token"
        );
      }
      // TODO: return JWT instead of user
      return verifiedUser;
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException(VerifyEmailErrors[VerifyEmailErrors.ERROR]);
    }
  }

  @Post("email/resend-verification/:email")
  public async sendEmailVerification(
    @Param("email") email: string
  ): Promise<string> {
    const user = await this.userService.findOne({ email });
    if (!user) {
      throw new NotFoundException(
        ResendResponse[ResendResponse.NOT_FOUND],
        "User not found for this email"
      );
    }

    try {
      await this.authService.sendVerificationEmail(user);
    } catch (error) {
      Logger.error(error);
      throw new BadRequestException(ResendResponse[ResendResponse.ERROR]);
    }
    return ResendResponse[ResendResponse.SUCCESS];
  }
}
