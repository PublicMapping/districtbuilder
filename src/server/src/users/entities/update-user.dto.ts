import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

import { UpdateUserData } from "../../../../shared/entities";

export class UpdateUserDataDto implements UpdateUserData {
  @IsNotEmpty({ message: "Please enter your name" })
  @IsOptional()
  name: string;
  @IsBoolean()
  @IsOptional()
  hasSeenTour: boolean;
}
