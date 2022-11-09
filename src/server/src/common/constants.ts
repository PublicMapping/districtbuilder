import os from "os";
import { ENVIRONMENT } from "../../../shared/constants";

export const BCRYPT_SALT_ROUNDS = 10;
export const EMAIL_VERIFICATION_TOKEN_LENGTH = 20;
export const DEFAULT_FROM_EMAIL =
  process.env.DEFAULT_FROM_EMAIL || "no-reply@staging.districtbuilder.org";

// One worker/CPU works well on AWS using memory-optimized units
// For dev & CI that's not the case, so just use a fixed amount
export const NUM_WORKERS =
  ENVIRONMENT.toUpperCase() === "DEVELOPMENT" || ENVIRONMENT.toUpperCase() === "TEST"
    ? 3
    : os.cpus().length;
