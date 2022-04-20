import { IsUUID } from "class-validator";
import { IProjectTemplate, ProjectTemplateId } from "@districtbuilder/shared/entities";

export class ProjectTemplateIdDto implements Pick<IProjectTemplate, "id"> {
  @IsUUID()
  readonly id: ProjectTemplateId;
}
