import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as process from "process";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";

const username = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "database.service.districtbuilder.internal",
      port: 5432,
      username,
      password,
      database: "postgres",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true
    }),
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
