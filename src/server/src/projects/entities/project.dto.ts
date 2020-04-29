import { IsNotEmpty, IsUUID } from "class-validator";

import {
  ChamberId,
  CreateProjectData,
  IChamber,
  IRegionConfig,
  RegionConfigId
} from "../../../../shared/entities";

class RegionConfigIdDto implements Pick<IRegionConfig, "id"> {
  @IsUUID()
  readonly id: RegionConfigId;
}

// tslint:disable-next-line max-classes-per-file
class ChamberIdDto implements Pick<IChamber, "id"> {
  @IsUUID()
  readonly id: ChamberId;
}

// tslint:disable-next-line max-classes-per-file
export class CreateProjectDto implements CreateProjectData {
  @IsNotEmpty()
  readonly name: string;
  readonly chamber: ChamberIdDto;
  readonly regionConfig: RegionConfigIdDto;
}
