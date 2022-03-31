import { IsEnum, IsOptional } from "class-validator";
import { ReferenceLayerColors } from "../../../../shared/constants";

import { UpdateReferenceLayer } from "../../../../shared/entities";

export class UpdateReferenceLayerDto implements UpdateReferenceLayer {
  @IsEnum(ReferenceLayerColors)
  @IsOptional()
  readonly layer_color: ReferenceLayerColors;
}
