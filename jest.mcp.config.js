// Jest configuration for MCP unit tests
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/mcp/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/mcp/**/*.js'
  ],
  coverageDirectory: 'coverage-mcp',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};