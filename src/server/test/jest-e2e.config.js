const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("../../../tsconfig.base.json");

module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  testTimeout: 50000,
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: "<rootDir>/../../../"
    }),
    "./worker.js": "<rootDir>/../../../dist/src/server/worker.js"
  }
};
