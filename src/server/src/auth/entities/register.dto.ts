import { IsEmail, IsNotEmpty, Validate } from "class-validator";

import { Register } from "../../../../shared/entities";
import { PasswordValidator } from "../validators/password.validator";

export class RegisterDto implements Register {
  @IsEmail({}, { message: "Email address is not valid" })
  readonly email: string;
  @IsNotEmpty({ message: "Please enter a password" })
  @Validate(PasswordValidator, { message: "Password is not valid" })
  readonly password: string;
  @IsNotEmpty({ message: "Please enter a name" })
  readonly name: string;
}
