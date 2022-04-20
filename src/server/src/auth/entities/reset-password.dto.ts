import { IsNotEmpty, Validate } from "class-validator";

import { ResetPassword } from "@districtbuilder/shared/entities";
import { PasswordValidator } from "../validators/password.validator";

export class ResetPasswordDto implements ResetPassword {
  @IsNotEmpty({ message: "Please enter a password" })
  @Validate(PasswordValidator, { message: "Invalid password" })
  readonly password: string;
}
