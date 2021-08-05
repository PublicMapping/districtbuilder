import { IsNotEmpty } from "class-validator";
import { ReferenceLayerTypes } from "../../../../shared/constants";

import { CreateReferenceLayerData } from "../../../../shared/entities";
import { ProjectIdDto } from "../../projects/entities/project-id.dto";
import { ReferenceLayerGeojson } from "./reference-layer.entity";

export class CreateReferenceLayerDto implements CreateReferenceLayerData {
  @IsNotEmpty({ message: "Please enter a name for your project" })
  readonly name: string;
  @IsNotEmpty({ message: "Please enter a project ID" })
  readonly project: ProjectIdDto;
  @IsNotEmpty({ message: "Please enter a layer type" })
  readonly layer_type: ReferenceLayerTypes;
  @IsNotEmpty({ message: "Please enter a label field" })
  readonly label_field: string;
  @IsNotEmpty({ message: "Please enter a value field" })
  readonly layer: ReferenceLayerGeojson;
}