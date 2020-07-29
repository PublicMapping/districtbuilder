import { IsEmail, IsNotEmpty, Validate } from "class-validator";

import { Register } from "../../../../shared/entities";
import { PasswordValidator } from "../validators/password.validator";

export class RegisterDto implements Register {
  @IsEmail()
  readonly email: string;
  @IsNotEmpty()
  @Validate(PasswordValidator, { message: "Password is invalid" })
  readonly password: string;
  @IsNotEmpty()
  readonly name: string;
}
