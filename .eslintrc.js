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
      "plugin:react/recommended",
      "plugin:functional/external-recommended",
      "plugin:functional/recommended",
      "prettier/@typescript-eslint",
    ],
    settings: {
      react: {
        version: "detect"
      }
    },
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
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "functional/functional-parameters": "off",
      "functional/prefer-type-literal": "off",
      "functional/no-conditional-statement": [
        "error",
        {
          "allowReturningBranches": "ifExhaustive"
        }
      ],
      "functional/no-expression-statement": "off",
      "functional/no-return-void": "off",
    }
  };
