import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TerminusModule } from "@nestjs/terminus";
import { TypeOrmModule } from "@nestjs/typeorm";

import { HandlebarsAdapter, MailerModule } from "@nestjs-modules/mailer";
import { SES } from "aws-sdk";
import * as SESTransport from "nodemailer/lib/ses-transport";

import { AuthModule } from "./auth/auth.module";
import { HealthCheckModule } from "./healthcheck/healthcheck.module";
import { ProjectsModule } from "./projects/projects.module";
import { RegionConfigsModule } from "./region-configs/region-configs.module";
import { UsersModule } from "./users/users.module";

import { join } from "path";

const mailTransportOptions: SESTransport.Options = {
  SES: new SES({
    apiVersion: "2010-12-01"
  })
};

@Module({
  imports: [
    MailerModule.forRoot({
      transport: mailTransportOptions,
      defaults: {
        from: '"nest-modules" <modules@nestjs.com>'
      },
      template: {
        dir: join(__dirname, "..", "..", "templates"),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true
        }
      }
    }),
    TypeOrmModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "static"),
      // https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts
      serveStaticOptions: {
        maxAge: 60000
      }
    }),
    TerminusModule,
    AuthModule,
    HealthCheckModule,
    UsersModule,
    RegionConfigsModule,
    ProjectsModule
  ]
})
export class AppModule {}
