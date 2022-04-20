import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsNumber,
  Max,
  Min,
  ValidateIf
} from "class-validator";

import { CreateProjectData, DistrictsDefinition } from "@districtbuilder/shared/entities";
import { ChamberIdDto } from "../../chambers/entities/chamber-id.dto";
import { ProjectTemplateIdDto } from "../../project-templates/entities/project-template-id.dto";
import { RegionConfigIdDto } from "../../region-configs/entities/region-config-id.dto";

export class CreateProjectDto implements CreateProjectData {
  @ValidateIf(o => o.projectTemplate?.id === undefined)
  @IsNotEmpty({ message: "Please enter a name for your project" })
  readonly name?: string;

  @ValidateIf(o => o.projectTemplate?.id === undefined)
  @IsInt({ message: "Number of districts must be an integer" })
  @IsPositive({ message: "Number of districts must be a positive number" })
  readonly numberOfDistricts?: number;

  @ValidateIf(o => o.projectTemplate?.id === undefined)
  @IsNotEmpty({ message: "Need to supply a region configuration" })
  readonly regionConfig: RegionConfigIdDto;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  readonly districtsDefinition?: DistrictsDefinition;

  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  readonly numberOfMembers?: readonly number[];

  @IsOptional()
  @IsNumber()
  @Max(100, { message: "Population deviation must be between 0% and 100%" })
  @Min(0, { message: "Population deviation must be between 0% and 100%" })
  readonly populationDeviation?: number;

  @IsOptional()
  readonly chamber?: ChamberIdDto;

  @IsOptional()
  readonly projectTemplate?: ProjectTemplateIdDto;
}
