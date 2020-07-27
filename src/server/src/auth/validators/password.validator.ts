import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from "class-validator";

import { Register } from "../../../../shared/entities";
import { validate } from "../../../../shared/password-validator";

@ValidatorConstraint()
export class PasswordValidator implements ValidatorConstraintInterface {
  validate(obj: string, args?: ValidationArguments): boolean {
    const user = args ? (args.object as Register) : undefined;
    if (user) {
      const errors = validate(obj, [user.email, user.name]);
      return !Object.values(errors).some(hasError => hasError);
    }
    return true;
  }
}
