import COMMON_PASSWORDS from "./common-passwords";
import { SequenceMatcher } from "./difflib";

export function minLength(value: string, minLength: number) {
  const tooShort = value.length < minLength;
  return tooShort ? [`Password must be at least ${minLength} characters long`] : [];
}

export function common(value: string) {
  const isCommon = COMMON_PASSWORDS.indexOf(value) !== -1;
  return isCommon ? ["Password must not match a commonly used password"] : [];
}

export function entirelyNumeric(value: string) {
  const onlyNumeric = /^\d+$/.test(value);
  return onlyNumeric ? ["Password must contain at least 1 letter"] : [];
}

// Port of Django's UserAttributeSimilarityValidator
export function similar(value: string, disallowed: readonly string[]) {
  if (!value || !disallowed) {
    return [];
  } else {
    const isAllowed = disallowed.every(disallowedVal => {
      if (!disallowedVal) {
        return true;
      } else {
        const parts = disallowedVal.split(/\W+/).concat(disallowedVal);
        return parts.every(part => {
          const matcher = new SequenceMatcher(false, part.toLowerCase(), value.toLowerCase());
          return matcher.quickRatio() < 0.7;
        });
      }
    });
    return isAllowed ? [] : ["Password must not be too similar to email or name"];
  }
}

export function validate(
  value: string,
  userAttributes: readonly string[]
): readonly string[] | undefined {
  const errors = [
    ...minLength(value, 8),
    ...common(value),
    ...entirelyNumeric(value),
    ...similar(value, userAttributes)
  ];
  return value.length !== 0 && errors.length > 0 ? errors : undefined;
}
