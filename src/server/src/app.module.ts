import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TerminusModule } from "@nestjs/terminus";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthcheckService } from "./healthcheck/healthcheck.service";
import { UsersModule } from "./users/users.module";

import { join } from "path";

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "static"),
      // https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts
      serveStaticOptions: {
        maxAge: 60000
      }
    }),
    TerminusModule.forRootAsync({ useClass: HealthcheckService }),
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
