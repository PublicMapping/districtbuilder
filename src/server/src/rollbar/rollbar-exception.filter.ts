import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Response } from "express";
import { RollbarService } from "./rollbar.service";

@Catch(HttpException)
export class RollbarExceptionFilter implements ExceptionFilter {
  constructor(private rollbar: RollbarService) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    this.rollbar.error("Testing Rollbar");
    response.status(status).json(exception.getResponse());
  }
}
