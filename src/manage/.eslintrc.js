module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: "tsconfig.json",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true
      },
    },
    plugins: [
      "@typescript-eslint",
      "import",
      "jsdoc",
      "prefer-arrow",
      "functional",
    ],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking",
      "plugin:functional/external-recommended",
      "prettier/@typescript-eslint",
    ],
    rules: {
      "no-unused-expressions": [
        "error",
        {
          "allowShortCircuit": true,
          "allowTernary": true,
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
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "functional/prefer-readonly-type": "off",

      // TODO: turn these rules back on and fix the errors
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    }
  };
