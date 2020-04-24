import { IsInt, IsNotEmpty, IsUUID } from "class-validator";

import { CreateProjectData, RegionConfigId } from "../../../../shared/entities";

export class ProjectDto implements CreateProjectData {
  @IsNotEmpty()
  readonly name: string;
  @IsInt()
  readonly numberOfDistricts: number;
  @IsUUID()
  readonly regionConfigId: RegionConfigId;
}
