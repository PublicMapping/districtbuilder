import {
  ArgumentsHost,
  Catch,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  Request,
  UnauthorizedException
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { RollbarService } from "./rollbar.service";

export interface IGetUserAuthInfoRequest extends Request {
  user?: {
    id: number;
  };
  socket: any;
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

@Catch()
export class RollbarExceptionFilter extends BaseExceptionFilter {
  constructor(private rollbar: RollbarService) {
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
      const customPayload = request.user
        ? {
            user_id: request.user.id
          }
        : {};

      this.rollbar.error(exception, request, {
        ...customPayload,
        ip_address: request.headers.get("x-forwarded-for") || request.socket.remoteAddress
      });
    }

    // Delegate error messaging and response to default global exception filter
    super.catch(exception, host);
  }
}
