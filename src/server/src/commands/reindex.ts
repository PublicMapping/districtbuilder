import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { DEBUG } from "../common/constants";
import { Connection } from "typeorm";

async function bootstrap(): Promise<void> {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule, {
    logger: DEBUG ? ["debug", "verbose", "log", "warn", "error"] : ["log", "warn", "error"]
  });

  const connection = app.get(Connection);
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  try {
    logger.log("Running REINDEX on project table");
    await queryRunner.query("REINDEX TABLE CONCURRENTLY project");
  } catch (e) {
    logger.error("REINDEX on project table failed");
  } finally {
    await queryRunner.release();
  }

  await app.close();
}
bootstrap(); // eslint-disable-line @typescript-eslint/no-floating-promises
