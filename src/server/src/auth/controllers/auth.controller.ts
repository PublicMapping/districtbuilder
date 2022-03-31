import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes";
import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException
} from "@nestjs/common";

import {
  ForgotPasswordResponse,
  LoginErrors,
  RegisterResponse,
  ResendResponse,
  ResetPasswordResponse,
  VerifyEmailErrors
} from "../../../../shared/constants";
import { JWT, OrganizationSlug } from "../../../../shared/entities";
import { Errors } from "../../../../shared/types";
import { UsersService } from "../../users/services/users.service";
import { OrganizationsService } from "../../organizations/services/organizations.service";

import { LoginDto } from "../entities/login.dto";
import { RegisterDto } from "../entities/register.dto";
import { ResetPasswordDto } from "../entities/reset-password.dto";
import { AuthService } from "../services/auth.service";
import { Organization } from "../../organizations/entities/organization.entity";
import { User } from "../../users/entities/user.entity";

/*
 * Authentication service that handles logins, account activiation and
 * password maintenance.
 *
 * Pay careful attention when modifying this module to not unintentionally log
 * any passwords or hashes through stack traces or generated error messages.
 */
@Controller("api/auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly orgService: OrganizationsService,
    private readonly userService: UsersService
  ) {}

  @Post("email/login")
  public async login(@Body() login: LoginDto): Promise<JWT> {
    try {
      const userOrError = await this.authService.validateLogin(login.email, login.password);
      if (userOrError === LoginErrors.NOT_FOUND) {
        throw new NotFoundException({
          error: LoginErrors.NOT_FOUND,
          message: { email: [`Email ${login.email} not found`] }
        } as Errors<LoginDto>);
      } else if (userOrError === LoginErrors.INVALID_PASSWORD) {
        throw new UnauthorizedException({
          error: LoginErrors.INVALID_PASSWORD,
          message: { password: ["Invalid password"] }
        } as Errors<LoginDto>);
      }
      const user: User = userOrError;
      await this.authService.updateLastLogin(user.id);
      return this.authService.generateJwt(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        // Intentionally not logging errors as they may contain passwords
        this.logger.error(`Error logging user in`);
        throw new InternalServerErrorException("Unable to log in user");
      }
    }
  }

  async getOrg(organizationSlug: OrganizationSlug): Promise<Organization> {
    const org = await this.orgService.findOne({ slug: organizationSlug });
    if (!org) {
      throw new NotFoundException(`Organization ${organizationSlug} not found`);
    }
    return org;
  }

  @Post("email/register")
  async register(@Body() registerDto: RegisterDto): Promise<JWT> {
    try {
      const newUser = await this.userService.create(registerDto);
      if (!registerDto.organization) {
        await this.authService.sendInitialVerificationEmail(newUser);
      } else {
        // If user joined from an organization's page, send them customized email and add them to the organization
        await this.authService.sendInitialVerificationEmail(newUser, registerDto.organization);
        const org = await this.getOrg(registerDto.organization);
        // eslint-disable-next-line
        org.users = [...org.users, newUser];
        await this.orgService.save(org);
      }

      return this.authService.generateJwt(newUser);
    } catch (error) {
      if (error.name === "QueryFailedError" && error.code === PG_UNIQUE_VIOLATION) {
        throw new BadRequestException({
          error: RegisterResponse.DUPLICATE,
          message: { email: [`User with email '${registerDto.email}' already exists`] }
        } as Errors<RegisterDto>);
      } else {
        // Intentionally not logging errors as they may contain passwords
        this.logger.error(`Error registering user`);
        throw new InternalServerErrorException();
      }
    }
  }

  @Post("email/verify/:token")
  public async verifyEmail(@Param("token") token: string): Promise<JWT> {
    try {
      const verifiedUser = await this.authService.verifyInitialEmail(token);
      if (verifiedUser === undefined) {
        throw new NotFoundException(
          "Email or user not found for token",
          VerifyEmailErrors.NOT_FOUND
        );
      }
      return this.authService.generateJwt(verifiedUser);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error(`Error verifying email token: ${error}`);
        throw new InternalServerErrorException();
      }
    }
  }

  @Post("email/resend-verification/:email")
  public async sendEmailVerification(@Param("email") email: string): Promise<string> {
    try {
      const user = await this.userService.findOne({ email });
      if (!user) {
        throw new NotFoundException("User not found for this email", ResendResponse.NOT_FOUND);
      }
      await this.authService.sendInitialVerificationEmail(user);
      return ResendResponse.SUCCESS;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error(`Error sending email verification: ${error}`);
        throw new InternalServerErrorException();
      }
    }
  }

  @Post("email/forgot-password/:email")
  public async initiateForgotPassword(@Param("email") email: string): Promise<string> {
    try {
      const user = await this.userService.findOne({ email });
      if (!user) {
        throw new NotFoundException(
          "User not found for this email",
          ForgotPasswordResponse.NOT_FOUND
        );
      }
      await this.authService.sendPasswordResetEmail(user);
      return ForgotPasswordResponse.SUCCESS;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error(`Error sending password reset email: ${error}`);
        throw new InternalServerErrorException();
      }
    }
  }

  @Post("email/reset-password/:token")
  public async resetPassword(
    @Param("token") token: string,
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<string> {
    try {
      const verifiedUser = await this.authService.resetPassword(token, resetPasswordDto.password);
      if (verifiedUser === undefined) {
        throw new NotFoundException(
          "Reset link not found, it may have expired or been mistyped",
          ResetPasswordResponse.NOT_FOUND
        );
      }
      // Could return a JWT here and log the user in but we're choosing to make
      // them use the new password they just set by redirecting to login
      return ResetPasswordResponse.SUCCESS;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.logger.error(`Error verifying email token: ${error}`);
        throw new InternalServerErrorException();
      }
    }
  }
}
