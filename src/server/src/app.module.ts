import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TerminusModule } from "@nestjs/terminus";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { SES } from "aws-sdk";
import * as SESTransport from "nodemailer/lib/ses-transport";
import * as StreamTransport from "nodemailer/lib/stream-transport";

import { DEBUG } from "./common/constants";
import { AuthModule } from "./auth/auth.module";
import { HealthCheckModule } from "./healthcheck/healthcheck.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { ProjectsModule } from "./projects/projects.module";
import { ProjectTemplatesModule } from "./project-templates/project-templates.module";
import { RegionConfigsModule } from "./region-configs/region-configs.module";
import { RollbarModule } from "./rollbar/rollbar.module";
import { UsersModule } from "./users/users.module";

import { join } from "path";

let mailTransportOptions: StreamTransport.Options | SESTransport.Options;
// In development the email service is a no-op that only logs
if (DEBUG) {
  mailTransportOptions = {
    streamTransport: true,
    buffer: true,
    newline: "unix"
  };
} else {
  mailTransportOptions = {
    SES: new SES({
      apiVersion: "2010-12-01"
    })
  };
}

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
    RollbarModule,
    AuthModule,
    HealthCheckModule,
    OrganizationsModule,
    ProjectsModule,
    ProjectTemplatesModule,
    RegionConfigsModule,
    UsersModule
  ]
})
export class AppModule {}
