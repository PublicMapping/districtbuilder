import { IsNotEmpty } from "class-validator";

import { AddUser, UserId } from "@districtbuilder/shared/entities";

export class OrganizationUserDto implements AddUser {
  @IsNotEmpty({ message: "Please enter a user ID to add to the organization" })
  readonly userId: UserId;
}
