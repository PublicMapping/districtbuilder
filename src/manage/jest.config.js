module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only look in specific source directory relative to this one where tests live.
  // This prevents finding the same tests in src/manage/lib/ where they are repeated.
  // See also: https://github.com/facebook/jest/issues/8226#issuecomment-578187397
  rootDir: process.env.PWD + '/src'
};
