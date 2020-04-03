import { IsEmail, IsNotEmpty } from "class-validator";

import { Login } from "../../../../shared/entities";

export class LoginDto implements Login {
  @IsEmail()
  readonly email: string;
  @IsNotEmpty()
  readonly password: string;
}
