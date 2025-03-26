module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  // Configure test output to be less verbose
  silent: false,
  verbose: false,
  // Handle ES modules
  transformIgnorePatterns: [
    // Important: This pattern allows Jest to transform ES modules in node_modules
    'node_modules/(?!(unified|unist|remark|mdast|micromark|bail|trough|vfile|))',
  ],
};
