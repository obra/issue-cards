# End-to-End Tests for Issue Cards

This directory contains comprehensive end-to-end tests for the Issue Cards CLI. These tests use the actual CLI binary and verify that all command-line operations work correctly when combined into real-world workflows.

## Test Structure

The end-to-end tests are organized into two main files:

1. **lifecycle.test.js**: Tests the complete lifecycle of issues, from creation to completion, in an integrated manner.
2. **commands.test.js**: Tests each individual command with various parameters and options.

## Running the Tests

You can run the E2E tests with the following command:

```bash
npm run test:e2e
```

To run all tests (unit and E2E):

```bash
npm test
```

To run only unit tests:

```bash
npm run test:unit
```

## Testing Approach

The E2E tests follow these principles:

1. **Real Environment**: Tests use a temporary directory with a real file system (not mocked)
2. **Actual CLI Commands**: Commands are executed through the actual CLI binary
3. **Full Workflows**: Tests cover complete issue workflows from creation to completion
4. **Isolated Tests**: Each test runs in its own isolated environment
5. **Comprehensive Coverage**: All commands and options are tested
6. **Cleanup**: Test environments are cleaned up after running

## Key Test Scenarios

The tests verify:

- Issue creation with all template types
- Task management (adding, completing, inserting tasks)
- Note and question management
- Template listing and viewing
- Issue listing and viewing
- Current task identification and completion
- Error handling
- Custom directory configuration with environment variables

## Environment Variables

Tests use the `ISSUE_CARDS_DIR` environment variable to control where issues are stored. This ensures that tests can run in a clean, isolated environment without affecting the user's actual issues.

## Adding New Tests

When adding new features to Issue Cards, you should:

1. Add corresponding E2E tests that verify the feature works in an integrated workflow
2. Run the E2E test suite to ensure your changes don't break existing functionality
3. Consider adding both lifecycle tests (how the feature works in a workflow) and command tests (how the command works with different parameters)