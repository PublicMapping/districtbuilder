import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from "class-validator";

@ValidatorConstraint()
export class DistrictsDefinitionFormatValidator implements ValidatorConstraintInterface {
  validate(obj: ReadonlyArray<any>, args?: ValidationArguments): boolean {
    return obj.every(
      elem => Number.isInteger(elem) || (Array.isArray(elem) && this.validate(elem))
    );
  }
}
