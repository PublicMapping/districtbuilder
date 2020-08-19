import { join } from "path";
import { Injectable } from "@nestjs/common";
import Rollbar from "rollbar";
import { DEBUG, ENVIRONMENT } from "../common/constants";

@Injectable()
export class RollbarService extends Rollbar {
  constructor() {
    super({
      enabled: !DEBUG,
      accessToken: process.env.ROLLBAR_ACCESS_TOKEN || "",
      captureUncaught: true,
      captureUnhandledRejections: true,
      payload: {
        environment: ENVIRONMENT.toLowerCase(),
        server: {
          root: join(__dirname, "..")
        }
      }
    });
  }
}
