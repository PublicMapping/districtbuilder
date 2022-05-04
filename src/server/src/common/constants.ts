import os from "os";

export const ENVIRONMENT = process.env.NODE_ENV || "Development";
export const DEBUG = ENVIRONMENT === "Development";
export const BCRYPT_SALT_ROUNDS = 10;
export const EMAIL_VERIFICATION_TOKEN_LENGTH = 20;
export const DEFAULT_FROM_EMAIL =
  process.env.DEFAULT_FROM_EMAIL || "no-reply@staging.districtbuilder.org";

// One worker/CPU works well on AWS using memory-optimized units
// For dev that's not the case, so just use a fixed amount
export const NUM_WORKERS = DEBUG ? 2 : os.cpus().length;
