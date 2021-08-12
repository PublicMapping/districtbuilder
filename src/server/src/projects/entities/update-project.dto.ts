import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min
} from "class-validator";

import { ProjectVisibility } from "../../../../shared/constants";
import { DistrictsDefinition, UpdateProjectData, MetricField } from "../../../../shared/entities";

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
  @IsNumber()
  @Max(100, { message: "Population deviation must be between 0% and 100%" })
  @Min(0, { message: "Population deviation must be between 0% and 100%" })
  readonly populationDeviation: number;
  @IsEnum(ProjectVisibility)
  @IsOptional()
  readonly visibility: ProjectVisibility;
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  readonly pinnedMetricFields: MetricField[];
  @IsBoolean()
  @IsOptional()
  readonly archived: boolean;
}
