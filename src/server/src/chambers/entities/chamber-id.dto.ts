import { IsUUID } from "class-validator";
import { IChamber, ChamberId } from "@districtbuilder/shared/entities";

export class ChamberIdDto implements Pick<IChamber, "id"> {
  @IsUUID()
  readonly id: ChamberId;
}
