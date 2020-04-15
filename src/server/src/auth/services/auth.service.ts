import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import base64url from "base64url";
import { randomBytes } from "crypto";
import { getManager, Repository } from "typeorm";

import { LoginErrors } from "../../../../shared/constants";
import { IUser, JWT, UserId } from "../../../../shared/entities";
import { EMAIL_VERIFICATION_TOKEN_LENGTH, FROM_EMAIL } from "../../constants";
import { User } from "../../users/entities/user.entity";
import { UsersService } from "../../users/services/users.service";
import { EmailVerification } from "../entities/email-verification.entity";

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

  async sendVerificationEmail(user: User): Promise<void> {
    const emailToken = await generateEmailToken();
    const data = {
      email: user.email,
      emailToken,
      timestamp: new Date()
    };

    await this.emailVerificationRepo
      .createQueryBuilder()
      .insert()
      .into(EmailVerification)
      .values(data)
      .onConflict(`("email") DO UPDATE SET "emailToken" = :emailToken, "timestamp" = :timestamp`)
      .setParameters(data)
      .execute();

    const info = await this.mailerService.sendMail({
      to: user.email,
      from: FROM_EMAIL,
      subject: "Verify your DistrictBuilder account",
      context: {
        emailToken,
        user
      },
      template: "verify"
    });

    this.logger.debug(info.envelope, info.message.toString());

    return;
  }

  async verifyEmail(token: string): Promise<User | undefined> {
    const emailVerif = await this.emailVerificationRepo.findOne({
      emailToken: token
    });
    if (emailVerif) {
      const userFromDb = await this.usersService.findOne({
        email: emailVerif.email
      });
      if (userFromDb) {
        /* tslint:disable:no-object-mutation */
        userFromDb.isEmailVerified = true;
        let savedUser;
        await getManager().transaction(async transactionalEntityManager => {
          savedUser = await transactionalEntityManager.save(userFromDb);
          await transactionalEntityManager.remove(emailVerif);
        });
        return savedUser;
        /* tslint:enable */
      }
    }
  }
}
