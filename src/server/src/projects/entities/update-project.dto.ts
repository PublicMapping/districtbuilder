import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Max
} from "class-validator";

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
  @IsOptional()
  @IsPositive({ message: "Population deviation must be positive" })
  @IsNumber()
  @Max(100, { message: "Population deviation must be between 0% and 100%" })
  readonly populationDeviation: number;
  @IsEnum(ProjectVisibility)
  @IsOptional()
  readonly visibility: ProjectVisibility;
  @IsBoolean()
  @IsOptional()
  readonly archived: boolean;
}
