import { IsNotEmpty } from "class-validator";

import { CreateProjectTemplateData } from "@districtbuilder/shared/entities";
import { ProjectIdDto } from "../../projects/entities/project-id.dto";

export class CreateProjectTemplateDto implements CreateProjectTemplateData {
  @IsNotEmpty({ message: "Please enter a description" })
  readonly description: string;

  @IsNotEmpty({ message: "Please enter details" })
  readonly details: string;

  @IsNotEmpty({ message: "Please enter project id" })
  readonly project: ProjectIdDto;
}
