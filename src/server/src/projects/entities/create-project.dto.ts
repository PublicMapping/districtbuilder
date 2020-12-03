import { Allow, IsInt, IsNotEmpty, IsPositive } from "class-validator";

import { CreateProjectData, DistrictsDefinition } from "../../../../shared/entities";
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
}
