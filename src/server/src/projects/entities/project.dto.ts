import { IsInt, IsNotEmpty, IsUUID } from "class-validator";

import { CreateProjectData, IRegionConfig, RegionConfigId } from "../../../../shared/entities";

class RegionConfigIdDto implements Pick<IRegionConfig, "id"> {
  @IsUUID()
  readonly id: RegionConfigId;
}

// tslint:disable-next-line max-classes-per-file
export class CreateProjectDto implements CreateProjectData {
  @IsNotEmpty()
  readonly name: string;
  @IsInt()
  readonly numberOfDistricts: number;
  readonly regionConfig: RegionConfigIdDto;
}
