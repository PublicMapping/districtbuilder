import { IsUUID } from "class-validator";
import { IRegionConfig, RegionConfigId } from "../../../../shared/entities";

export class RegionConfigIdDto implements Pick<IRegionConfig, "id"> {
  @IsUUID()
  readonly id: RegionConfigId;
}
