module.exports = {
  displayName: "server",
  preset: "../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  rootDir: "src",
  testEnvironment: "node",
  testRegex: ".spec.ts$",
  transform: {
    "^.+\\.[tj]s$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../../coverage/apps/api",
};
