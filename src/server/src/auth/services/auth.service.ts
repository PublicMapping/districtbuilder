import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import base64url from "base64url";
import { randomBytes } from "crypto";
import { getManager, Repository } from "typeorm";

import { LoginErrors } from "../../../../shared/constants";
import { IUser, JWT, UserId } from "../../../../shared/entities";
import { EMAIL_VERIFICATION_TOKEN_LENGTH, DEFAULT_FROM_EMAIL } from "../../common/constants";
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
    private readonly emailVerificationRepo: Repository<EmailVerification>,
    private readonly mailerService: MailerService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
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

  async updateLastLogin(userId: UserId): Promise<void> {
    return await this.usersService.updateLastLogin(userId);
  }

  generateJwt(user: User): JWT {
    const payload: IUser & { sub: UserId } = {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      hasSeenTour: user.hasSeenTour,
      organizations: user.organizations,
      adminOrganizations: user.adminOrganizations
    };
    return this.jwtService.sign(payload);
  }

  // The @nestjs-modules/mailer MailerService.sendMail method returns a Promise for a
  // SentMessageInfo object, which @types/nodemailer defines as an any type object. This object
  // could have a raw or message property defined. We're checking that here to be more explicit
  // about logging errors vs. informational output.
  private logSentEmail(info: any): void {
    const body = info.raw || info.message;
    if (body) {
      this.logger.debug(info.envelope, body.toString());
    } else {
      this.logger.error("Email body is undefined", info);
    }
  }

  async sendInitialVerificationEmail(user: User, org?: string): Promise<void> {
    const emailToken = await this.sendEmailVerification(user, VerificationType.INITIAL);

    const info = await this.mailerService.sendMail({
      to: user.email,
      from: DEFAULT_FROM_EMAIL,
      subject: org
        ? `Verify your DistrictBuilder account and join ${org}`
        : `Verify your DistrictBuilder account`,
      context: {
        user,
        url: org
          ? `${process.env.CLIENT_URL}/activate/${emailToken}/${org}`
          : `${process.env.CLIENT_URL}/activate/${emailToken}`
      },
      template: "verify"
    });

    this.logSentEmail(info);

    return;
  }

  async sendPasswordResetEmail(user: User): Promise<void> {
    const emailToken = await this.sendEmailVerification(user, VerificationType.FORGOT_PASSWORD);

    const info = await this.mailerService.sendMail({
      to: user.email,
      from: DEFAULT_FROM_EMAIL,
      subject: "Reset your DistrictBuilder password",
      context: {
        user,
        url: `${process.env.CLIENT_URL}/password-reset/${emailToken}`
      },
      template: "passwordreset"
    });

    this.logSentEmail(info);

    return;
  }

  async verifyInitialEmail(token: string): Promise<User | undefined> {
    return this.verifyEmail(token, VerificationType.INITIAL, user => {
      // eslint-disable-next-line functional/immutable-data
      user.isEmailVerified = true;
    });
  }

  async resetPassword(token: string, password: string): Promise<User | undefined> {
    return this.verifyEmail(token, VerificationType.FORGOT_PASSWORD, user => {
      /* eslint-disable functional/immutable-data */
      // Token-based password reset goes through email and so will verify email
      // address if that hasn't happened yet
      user.isEmailVerified = true;
      return user.setPassword(password);
      /* eslint-enable */
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
