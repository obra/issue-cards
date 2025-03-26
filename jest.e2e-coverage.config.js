// Special jest config for E2E code coverage
const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  // Specific settings for E2E coverage
  testMatch: ['**/tests/e2e/**/*.test.js'],
  // We need to ensure coverage is collected directly, not via child processes
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js'],
  coverageReporters: ['text', 'lcov'],
  // Make source-map-support available in tests
  setupFiles: ['<rootDir>/tests/e2e/setup-e2e-coverage.js'],
};