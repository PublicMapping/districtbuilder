import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsNumber,
  Max,
  Min
} from "class-validator";

import { CreateProjectData, DistrictsDefinition } from "../../../../shared/entities";
import { ChamberIdDto } from "../../chambers/entities/chamber-id.dto";
import { ProjectTemplateIdDto } from "../../project-templates/entities/project-template-id.dto";
import { RegionConfigIdDto } from "../../region-configs/entities/region-config-id.dto";

export class CreateProjectDto implements CreateProjectData {
  @IsNotEmpty({ message: "Please enter a name for your project" })
  readonly name: string;
  @IsInt({ message: "Number of districts must be an integer" })
  @IsPositive({ message: "Number of districts must be a positive number" })
  readonly numberOfDistricts: number;
  @IsNotEmpty({ message: "Need to supply a region configuration" })
  readonly regionConfig: RegionConfigIdDto;
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  readonly districtsDefinition: DistrictsDefinition;
  @IsOptional()
  @IsNumber()
  @Max(100, { message: "Population deviation must be between 0% and 100%" })
  @Min(0, { message: "Population deviation must be between 0% and 100%" })
  readonly populationDeviation: number;
  @IsOptional()
  readonly chamber: ChamberIdDto;
  @IsOptional()
  readonly projectTemplate: ProjectTemplateIdDto;
}
