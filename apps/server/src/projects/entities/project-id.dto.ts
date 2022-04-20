import { IsUUID } from "class-validator";
import { IProject, ProjectId } from "@districtbuilder/shared/entities";

export class ProjectIdDto implements Pick<IProject, "id"> {
  @IsUUID()
  readonly id: ProjectId;
}
