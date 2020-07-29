import { IsNotEmpty, Validate } from "class-validator";

import { ResetPassword } from "../../../../shared/entities";
import { PasswordValidator } from "../validators/password.validator";

export class ResetPasswordDto implements ResetPassword {
  @IsNotEmpty()
  @Validate(PasswordValidator, { message: "Password is invalid" })
  readonly password: string;
}
