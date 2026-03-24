/** @type {import('jest').Config} */
module.exports = {
  // Only test the ForgeBeyond engine and plain JS/TS tests
  // (not React Native components which need a different setup)
  testMatch: [
    '<rootDir>/__tests__/**/*.test.[jt]s',
    '<rootDir>/tools/**/*.test.[jt]s',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
  // Use Node environment for analysis engine tests
  testEnvironment: 'node',
};
