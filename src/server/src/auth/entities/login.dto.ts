import { IsEmail, IsNotEmpty } from "class-validator";

import { Login } from "../../../../shared/entities";

export class LoginDto implements Login {
  @IsNotEmpty({ message "Please enter your email" })
  @IsEmail({}, { message "Invalid email" })
  readonly email: string;
  @IsNotEmpty({ message "Please enter your password" })
  readonly password: string;
}
