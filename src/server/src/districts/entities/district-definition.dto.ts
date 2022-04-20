import { ArrayNotEmpty, IsArray, Validate } from "class-validator";

import { DistrictsDefinition, IDistrictsDefinition } from "@districtbuilder/shared/entities";
import { DistrictsDefinitionFormatValidator } from "../validators/district-definition.validator";

export class DistrictsDefinitionDto implements IDistrictsDefinition {
  @IsArray()
  @ArrayNotEmpty()
  @Validate(DistrictsDefinitionFormatValidator)
  readonly districts: DistrictsDefinition;
}
