import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request, Response } from "express";
import { RollbarService } from "./rollbar.service";

@Catch()
export class RollbarExceptionFilter extends BaseExceptionFilter {
  constructor(private rollbar: RollbarService) {
    super();
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    this.rollbar.error(exception, request);

    super.catch(exception, host);
  }
}
