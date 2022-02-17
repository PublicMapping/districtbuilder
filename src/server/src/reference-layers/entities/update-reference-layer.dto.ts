import { IsNotEmpty, IsOptional } from "class-validator";
import { ReferenceLayerTypes, ReferenceLayerColors } from "../../../../shared/constants";

import { UpdateReferenceLayer } from "../../../../shared/entities";
import { ProjectIdDto } from "../../projects/entities/project-id.dto";
import { ReferenceLayerGeojson } from "./reference-layer.entity";

export class UpdateReferenceLayerDto implements UpdateReferenceLayer {
  @IsNotEmpty({ message: "Please enter a name for your project" })
  @IsOptional()
  readonly name: string;
  @IsNotEmpty({ message: "Please enter a project ID" })
  @IsOptional()
  readonly project: ProjectIdDto;
  @IsNotEmpty({ message: "Please enter a layer type" })
  @IsOptional()
  readonly layer_type: ReferenceLayerTypes;
  @IsOptional()
  readonly label_field?: string;
  @IsNotEmpty({ message: "Please enter a value field" })
  @IsOptional()
  readonly layer: ReferenceLayerGeojson;
  @IsNotEmpty({ message: "Please choose a layer color" })
  @IsOptional()
  readonly layer_color: ReferenceLayerColors;
}
