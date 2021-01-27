import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional } from "class-validator";

import { ProjectVisibility } from "../../../../shared/constants";
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
  @IsEnum(ProjectVisibility)
  @IsOptional()
  readonly visibility: ProjectVisibility;
  @IsBoolean()
  @IsOptional()
  readonly archived: boolean;
}
