import { BadRequestException, ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { BadRequestExceptionFilter } from "./common/bad-request-exception.filter";
import { DEBUG } from "./common/constants";
import * as bodyParser from "body-parser";
import { DistrictsModule } from "./districts/districts.module";
import { TopologyService } from "./districts/services/topology.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: DEBUG ? ["debug", "verbose", "log", "warn", "error"] : ["log", "warn", "error"]
  });
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: errors => new BadRequestException(errors),
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new BadRequestExceptionFilter());
  app.use(bodyParser.json({ limit: "25mb" }));
  app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));

  // Start TopoJSON loading
  const topologyService = app.select(DistrictsModule).get(TopologyService, { strict: true });
  topologyService.loadLayers().catch(() => app.close());

  // Save the output of 'listen' to a variable, which is a Node http.Server
  const server = await app.listen(3005);

  // Ensure all inactive connections are terminated by the ALB, by setting this
  // a few seconds higher than the ALB idle timeout
  server.keepAliveTimeout = 65000; // eslint-disable-line functional/immutable-data

  // Ensure the headersTimeout is set higher than the keepAliveTimeout due to
  // this nodejs regression bug: https://github.com/nodejs/node/issues/27363
  server.headersTimeout = 66000; // eslint-disable-line functional/immutable-data
}
bootstrap(); // eslint-disable-line @typescript-eslint/no-floating-promises
