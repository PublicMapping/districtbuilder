import { IsEmail, IsNotEmpty } from "class-validator";

import { Register } from "../../../../shared/entities";

export class RegisterDto implements Register {
  @IsEmail()
  readonly email: string;
  @IsNotEmpty()
  readonly password: string;
  @IsNotEmpty()
  readonly name: string;
}
