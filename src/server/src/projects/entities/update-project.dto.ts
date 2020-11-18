import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

import { DistrictsDefinition, UpdateProjectData } from "../../../../shared/entities";

export class UpdateProjectDto implements UpdateProjectData {
  @IsNotEmpty({ message: "Please enter a name for your project" })
  @IsOptional()
  readonly name: string;
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  readonly districtsDefinition: DistrictsDefinition;
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  readonly lockedDistricts: readonly boolean[];
  @IsBoolean()
  @IsOptional()
  readonly advancedEditingEnabled: boolean;
}
