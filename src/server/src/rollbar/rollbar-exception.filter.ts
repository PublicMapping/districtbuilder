import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request } from "express";
import { RollbarService } from "./rollbar.service";

@Catch()
export class RollbarExceptionFilter extends BaseExceptionFilter {
  constructor(private rollbar: RollbarService) {
    // BaseExceptionFilter will load applicationRef itself if no argument is given
    super();
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    this.rollbar.error(exception, request);

    // Delegate error messaging and response to default global exception filter
    super.catch(exception, host);
  }
}
