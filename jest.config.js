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
  // These ESM-only packages need to be transformed by Babel for Jest's CommonJS environment.
  // The packages form a deeply interconnected dependency tree used for markdown parsing:
  // - unified: Core processor
  // - unist: Unified syntax tree utilities
  // - remark: Markdown processor
  // - mdast: Markdown abstract syntax tree
  // - micromark: Markdown parser
  // - bail: Error handling utility
  // - trough: Middleware pipeline utility
  // - vfile: Virtual file system for unified
  transformIgnorePatterns: [
    'node_modules/(?!(unified|unist|remark|mdast|micromark|bail|trough|vfile|))',
  ],
};
