import { IsUUID } from "class-validator";
import { IProjectTemplate, ProjectTemplateId } from "../../../../shared/entities";

export class ProjectTemplateIdDto implements Pick<IProjectTemplate, "id"> {
  @IsUUID()
  readonly id: ProjectTemplateId;
}
