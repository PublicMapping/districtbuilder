import COMMON_PASSWORDS from "./common-passwords";
import { SequenceMatcher } from "./difflib";

export function minLength(value: string, minLength: number) {
  return value.length < minLength;
}

export function common(value: string) {
  return COMMON_PASSWORDS.indexOf(value) !== -1;
}

export function hasNonNumeric(value: string) {
  return value.length === 0 || /^\d+$/.test(value);
}

// Port of Django's UserAttributeSimilarityValidator
export function similar(value: string, disallowed: readonly string[]) {
  if (!value || !disallowed) {
    return false;
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
    return !isAllowed;
  }
}

export function validate(
  value: string,
  userAttributes: readonly string[]
): { readonly [field in "minLength" | "common" | "hasNonNumeric" | "similar"]: boolean } {
  return {
    minLength: minLength(value, 8),
    common: common(value),
    hasNonNumeric: hasNonNumeric(value),
    similar: similar(value, userAttributes)
  };
}
