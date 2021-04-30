import {
  ArgumentsHost,
  Catch,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";
import { RollbarService } from "./rollbar.service";

function isWhitelisted(exception: HttpException) {
  // Note that we don't need to whitelist BadRequestException as it has it's
  // own exception filter already
  return (
    exception instanceof NotFoundException ||
    exception instanceof ServiceUnavailableException ||
    exception instanceof UnauthorizedException
  );
}

@Catch()
export class RollbarExceptionFilter extends BaseExceptionFilter {
  constructor(private rollbar: RollbarService) {
    // BaseExceptionFilter will load applicationRef itself if no argument is given
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      (exception instanceof HttpException && !isWhitelisted(exception)) ||
      exception instanceof Error
    ) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest<Request>();

      this.rollbar.error(exception, request);
    }

    // Delegate error messaging and response to default global exception filter
    super.catch(exception, host);
  }
}
