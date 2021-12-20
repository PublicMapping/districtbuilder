import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter } from "@nestjs/common";
import { ValidationError } from "class-validator";
import { Response } from "express";

function convertValidationErrors(errors: readonly ValidationError[]): {
  [field: string]: readonly string[];
} {
  const fieldErrors = errors
    .map((error: ValidationError) => {
      return error.constraints ? [error.property, Object.values(error.constraints)] : undefined;
    })
    .filter(item => item !== undefined) as Array<[string, string[]]>;
  return Object.fromEntries(fieldErrors);
}

/**
 * Catches built-in validation errors and reworks their format to a simpler
 * one easier to consume from the client
 */
@Catch(BadRequestException)
export class BadRequestExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const errorResponse: any = exception.getResponse();
    const error =
      typeof errorResponse === "object" && "error" in errorResponse
        ? errorResponse.error
        : "Bad Request";
    const message =
      "message" in errorResponse &&
      Array.isArray(errorResponse.message) &&
      errorResponse.message.every((item: any) => item instanceof ValidationError)
        ? convertValidationErrors(errorResponse.message)
        : errorResponse.message;

    response.status(status).json({ error, message });
  }
}
