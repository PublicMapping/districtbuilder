import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import base64url from "base64url";
import { randomBytes } from "crypto";
import { getManager, Repository } from "typeorm";

import { LoginErrors } from "../../../../shared/constants";
import { IUser, JWT, UserId } from "../../../../shared/entities";
import { EMAIL_VERIFICATION_TOKEN_LENGTH, FROM_EMAIL } from "../../common/constants";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";
import { EmailVerification, VerificationType } from "../entities/email-verification.entity";

function generateEmailToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    randomBytes(EMAIL_VERIFICATION_TOKEN_LENGTH, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(base64url(buffer));
      }
    });
  });
}

const EMAIL_EXPIRATION_IN_MS = 60 * 60 * 24 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(EmailVerification)
    private emailVerificationRepo: Repository<EmailVerification>,
    private mailerService: MailerService,
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

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
        return await this.usersService.save(user);
      }
      return user;
    }

    return LoginErrors.INVALID_PASSWORD;
  }

  generateJwt(user: User): JWT {
    const payload: IUser & { sub: UserId } = {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    };
    return this.jwtService.sign(payload);
  }

  async sendInitialVerificationEmail(user: User): Promise<void> {
    const emailToken = this.sendEmailVerification(user, VerificationType.INITIAL);

    const info = await this.mailerService.sendMail({
      to: user.email,
      from: FROM_EMAIL,
      subject: "Verify your DistrictBuilder account",
      context: {
        user,
        url: `${process.env.CLIENT_URL}/activate/${emailToken}`
      },
      template: "verify"
    });

    this.logger.debug(info.envelope, info.message.toString());

    return;
  }

  async sendPasswordResetEmail(user: User): Promise<void> {
    const emailToken = await this.sendEmailVerification(user, VerificationType.FORGOT_PASSWORD);

    const info = await this.mailerService.sendMail({
      to: user.email,
      from: FROM_EMAIL,
      subject: "Reset your DistrictBuilder password",
      context: {
        user,
        url: `${process.env.CLIENT_URL}/password-reset/${emailToken}`
      },
      template: "passwordreset"
    });

    this.logger.debug(info.envelope, info.message.toString());

    return;
  }

  async verifyInitialEmail(token: string): Promise<User | undefined> {
    return this.verifyEmail(token, VerificationType.INITIAL, user => {
      /* tslint:disable:no-object-mutation */
      user.isEmailVerified = true;
      /* tslint:enable */
    });
  }

  async resetPassword(token: string, password: string): Promise<User | undefined> {
    return this.verifyEmail(token, VerificationType.FORGOT_PASSWORD, user => {
      /* tslint:disable:no-object-mutation */
      // Token-based password reset goes through email and so will verify email
      // address if that hasn't happened yet
      user.isEmailVerified = true;
      return user.setPassword(password);
      /* tslint:enable */
    });
  }

  private async sendEmailVerification(user: User, type: VerificationType): Promise<string> {
    const emailToken = await generateEmailToken();
    const data = {
      email: user.email,
      emailToken,
      timestamp: new Date(),
      type
    };

    await this.emailVerificationRepo
      .createQueryBuilder()
      .insert()
      .into(EmailVerification)
      .values(data)
      .onConflict(
        `("email", "type") DO UPDATE SET "emailToken" = :emailToken, "timestamp" = :timestamp`
      )
      .setParameters(data)
      .execute();

    return emailToken;
  }

  private async verifyEmail(
    emailToken: string,
    type: VerificationType,
    updateUser: (user: User) => void | Promise<void>
  ): Promise<User | undefined> {
    const emailVerif = await this.emailVerificationRepo.findOne({ emailToken, type });
    const now = new Date();
    const lastValidTimestamp = new Date(now.getTime() - EMAIL_EXPIRATION_IN_MS);
    if (emailVerif && emailVerif.timestamp > lastValidTimestamp) {
      const userFromDb = await this.usersService.findOne({
        email: emailVerif.email
      });
      if (userFromDb) {
        await updateUser(userFromDb);
        let savedUser;
        await getManager().transaction(async transactionalEntityManager => {
          savedUser = await transactionalEntityManager.save(userFromDb);
          await transactionalEntityManager.remove(emailVerif);
        });
        return savedUser;
      }
    }
  }
}
