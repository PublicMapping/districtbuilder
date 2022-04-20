module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module"
  },
  plugins: [
    "@typescript-eslint",
    "import",
    "jsdoc",
    "prefer-arrow",
    "functional",
    "eslint-plugin-local-rules"
  ],
  extends: [
    "../../.eslintrc.json",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:functional/external-recommended",
    // Using 'functionl/recommended or /lite turns on a bunch of rules that we don't want.
    "plugin:functional/no-mutations",
    "plugin:prettier/recommended"
  ],
  rules: {
    "no-unused-expressions": [
      "error",
      {
        allowShortCircuit: true,
        allowTernary: true
      }
    ],
    "no-console": ["error"],
    "no-restricted-imports": [
      "error",
      {
        // manage commands can't import server modules unless we always use relative imports
        patterns: ["src/*"]
      }
    ],
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/prefer-readonly-parameter-types": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "functional/immutable-data": [
      "error",
      {
        ignorePattern: "^mutable"
      }
    ],
    "functional/prefer-readonly-type": "off",
    "functional/no-let": "off",
    "functional/no-loop-statement": "error",
    "functional/no-conditional-statement": ["off"],
    "local-rules/no-providing-services-out-of-module": "error"
  }
};
