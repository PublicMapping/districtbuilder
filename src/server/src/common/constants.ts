export const ENVIRONMENT = process.env.NODE_ENV;
export const DEBUG = ENVIRONMENT === "Development";
export const BCRYPT_SALT_ROUNDS = 10;
export const EMAIL_VERIFICATION_TOKEN_LENGTH = 20;
export const DEFAULT_FROM_EMAIL =
  process.env.DEFAULT_FROM_EMAIL || "no-reply@staging.districtbuilder.azavea.com";
