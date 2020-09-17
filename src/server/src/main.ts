import { BadRequestException, ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { BadRequestExceptionFilter } from "./common/bad-request-exception.filter";
import { DEBUG } from "./common/constants";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: DEBUG ? ["debug", "verbose", "log", "warn", "error"] : ["log", "warn", "error"]
  });
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: errors => new BadRequestException(errors),
      transform: true
    })
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new BadRequestExceptionFilter());
  await app.listen(3005);
}
bootstrap(); // eslint-disable-line @typescript-eslint/no-floating-promises
