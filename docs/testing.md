# Testing Guide for Issue Cards

This document outlines our testing approach, practices, and utilities for the Issue Cards project.

## Testing Philosophy

Issue Cards follows a comprehensive testing approach with multiple layers:

1. **Unit Tests**: Testing individual functions and components in isolation
2. **Integration Tests**: Testing how components work together
3. **End-to-End (E2E) Tests**: Testing the CLI application as a whole

## Test Structure

Our tests are organized in the `tests/` directory with the following structure:

- `tests/utils/` - Unit tests for utility functions
- `tests/commands/` - Unit tests for command implementations
- `tests/integration/` - Integration tests for workflows
- `tests/e2e/` - End-to-end tests for CLI execution
- `tests/bin/` - Tests for the binary entry point

## Running Tests

We have several npm scripts to run tests:

```bash
# Run all tests
npm test

# Run tests with more detailed output
npm run test:verbose

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests (excludes E2E tests)
npm run test:unit

# Run only E2E tests
npm run test:e2e

# Run E2E tests with coverage collection
npm run test:e2e-coverage
```

### Code Coverage for E2E Tests

E2E tests execute the CLI as a separate process, which makes it challenging to collect coverage information. To address this, we've added a special E2E coverage collection mode:

1. The `test:e2e-coverage` script sets the `E2E_COLLECT_COVERAGE` environment variable
2. When this variable is set, our `runQuietly` helper switches to use `runWithCoverage`
3. `runWithCoverage` uses Node's source map support to improve coverage reporting
4. This allows us to collect coverage information from code run in subprocesses

Note that E2E coverage collection might report lower numbers than unit tests since E2E tests typically don't exercise all code paths and edge cases.

## E2E Testing Best Practices

When writing E2E tests that execute the CLI commands, follow these best practices:

### Using the `runQuietly` Helper

Always use the `runQuietly` helper from `tests/e2e/e2eHelpers.js` to execute CLI commands:

```javascript
const { runQuietly } = require('./e2eHelpers');

// Run a command and capture its output
const result = runQuietly(`node ${binPath} create feature --title "Test"`, {
  cwd: testDir,
  env: { ...process.env }
});

// Check status code
expect(result.status).toBe(0);

// Check stdout
expect(result.stdout).toContain('Created Issue');

// Check stderr
expect(result.stderr).toBe('');
```

This approach:
- Prevents command output from polluting the test output
- Provides a consistent interface for checking success/failure
- Makes tests more robust by capturing both stdout and stderr

### Capturing Command Output

The `runQuietly` helper returns an object with:
- `stdout`: The command's standard output
- `stderr`: The command's standard error output
- `status`: The exit code (0 for success, non-zero for failure)

Use this to verify command execution:

```javascript
// Success case
const successResult = runQuietly(`node ${binPath} list`, options);
expect(successResult.status).toBe(0);
expect(successResult.stdout).toContain('Expected output');

// Error case
const errorResult = runQuietly(`node ${binPath} invalid-command`, options);
expect(errorResult.status).not.toBe(0);
expect(errorResult.stderr).toContain('Expected error message');
```

### Handling Expected Failures

When testing error conditions, check the status and stderr:

```javascript
// Test a command that should fail
const result = runQuietly(`node ${binPath} show 999`, options);

// Verify it failed with the expected error
expect(result.status).not.toBe(0);
expect(result.stderr).toContain('Issue not found');
```

### Test Isolation

Each E2E test should:
1. Create a temporary directory for testing
2. Initialize issue tracking in that directory
3. Run tests in isolation from other tests
4. Clean up after itself

This pattern is implemented in most E2E test files and ensures tests don't interfere with each other.

## Writing New Tests

When adding new functionality:

1. Start with unit tests for individual functions
2. Add integration tests for component interactions
3. Add E2E tests for CLI behavior
4. Run the full test suite to ensure nothing broke

## Mocking

When unit testing components that have dependencies:

- Use Jest's mocking capabilities to isolate the component
- Mock file system operations where appropriate
- Mock dependencies to test error handling

## Test Coverage

We aim for high test coverage, especially for critical components:

- Run `npm run test:coverage` to generate a coverage report
- Look for uncovered areas of code and add tests
- Focus on testing edge cases and error handling

## Debugging Tests

If tests are failing:

1. Run with verbose output: `npm run test:verbose`
2. Use console.log statements for debugging (but remove them before committing)
3. Use the `--testNamePattern` flag to run specific tests: `npm test -- --testNamePattern="pattern"`

## Continuous Improvement

Our test suite should evolve with the codebase:

- Update tests when making changes to functionality
- Add regression tests when fixing bugs
- Refactor tests to maintain readability and performance