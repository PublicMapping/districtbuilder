import { IsInt, IsNotEmpty, IsPositive, IsUUID } from "class-validator";

import { CreateProjectData, IRegionConfig, RegionConfigId } from "../../../../shared/entities";

class RegionConfigIdDto implements Pick<IRegionConfig, "id"> {
  @IsUUID()
  readonly id: RegionConfigId;
}

// eslint-disable-next-line max-classes-per-file
export class CreateProjectDto implements CreateProjectData {
  @IsNotEmpty({ message: "Please enter a number of districts" })
  readonly name: string;
  @IsInt({ message: "Number of districts must be an integer" })
  @IsPositive({ message: "Number of districts must be a positive number" })
  readonly numberOfDistricts: number;
  readonly regionConfig: RegionConfigIdDto;
}
