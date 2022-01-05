import {
  ArgumentsHost,
  Catch,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { Request } from "express";
import { BaseExceptionFilter } from "@nestjs/core";
import { RollbarService } from "./rollbar.service";

export interface IGetUserAuthInfoRequest extends Request {
  user?: {
    id: number;
  };
}

function isWhitelisted(exception: HttpException) {
  // Note that we don't need to whitelist BadRequestException as it has it's
  // own exception filter already
  return (
    exception instanceof NotFoundException ||
    exception instanceof ServiceUnavailableException ||
    exception instanceof UnauthorizedException
  );
}

function parseIp(req: IGetUserAuthInfoRequest): string | undefined {
  if (req.headers["x-forwarded-for"]) {
    if (Array.isArray(req.headers["x-forwarded-for"])) {
      return req.headers["x-forwarded-for"][0];
    } else {
      return req.headers["x-forwarded-for"]?.split(",")[0];
    }
  } else {
    return req.socket?.remoteAddress;
  }
}

@Catch()
export class RollbarExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly rollbar: RollbarService) {
    // BaseExceptionFilter will load applicationRef itself if no argument is given
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      (exception instanceof HttpException && !isWhitelisted(exception)) ||
      (exception instanceof Error && !(exception instanceof HttpException))
    ) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest<IGetUserAuthInfoRequest>();
      this.rollbar.error(exception, {
        ...request,
        person: request.user ? { id: request.user.id } : {},
        ip_address: parseIp(request)
      });
    }

    // Delegate error messaging and response to default global exception filter
    super.catch(exception, host);
  }
}
