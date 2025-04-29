// ABOUTME: AI-specific workflow documentation for Test-Driven Development
// ABOUTME: Contains step-by-step instructions, best practices, and tool examples

# Test-Driven Development (TDD) Workflow

## Overview
This workflow guides you through applying Test-Driven Development principles in issue-cards. TDD is a software development approach where you write tests before implementing functionality, ensuring robust and well-tested code.

## The TDD Cycle
1. **Red**: Write a failing test that defines the expected behavior
2. **Green**: Write the minimum code necessary to pass the test
3. **Refactor**: Improve the code while keeping tests passing

## Steps

### 1. Start with your current task
Check your current task to ensure it's properly tagged with test templates:
```json
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

Tasks that follow TDD should use one of these tag templates:
- `+unit-test` - For component or function-level testing
- `+integration-test` - For testing component interactions and interfaces
- `+e2e-test` - For full application testing

### 2. Write failing tests (Red phase)
Begin by writing tests that clearly define the expected behavior:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Created tests that verify input validation rejects invalid email formats and requires password with minimum 8 characters"
  }
}
```

Confirm your tests fail for the expected reason:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Verified tests fail because the validation functionality doesn't exist yet"
  }
}
```

### 3. Implement minimum code to pass tests (Green phase)

Write just enough code to make the tests pass:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Implementation notes",
    "note": "Implemented validateEmail and validatePassword functions with regex patterns to satisfy test requirements"
  }
}
```

Confirm tests now pass:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Implementation notes",
    "note": "All validation tests now pass"
  }
}
```

### 4. Refactor while maintaining test coverage (Refactor phase)

Improve your implementation while ensuring tests continue to pass:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Refactoring",
    "note": "Extracted validation logic into a separate ValidationService class to enable reuse across components"
  }
}
```

Document any challenges or decisions:

```json
{
  "tool": "mcp__logFailure",
  "args": {
    "approach": "Tried moving validation to server-side only",
    "reason": "Reduced user experience by waiting for server response for simple validations"
  }
}
```

### 5. Complete the task

Once your tests are passing and code is refactored, mark the task as complete:

```json
{
  "tool": "mcp__completeTask",
  "args": {}
}
```

### 6. Continue with the next task in the TDD cycle

## Example TDD Task Sequence

Here's an example of a complete TDD workflow for implementing form validation:

1. **Task**: "Implement form validation for user registration +unit-test"

2. **Expanded subtasks**:
   - Write failing unit tests for form validation
   - Implement validation to pass tests
   - Refactor validation while maintaining test coverage

3. **Test implementation (Red phase)**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Test implementation",
       "note": "Created tests that verify:\n1. Email must be valid format\n2. Password must be at least 8 characters\n3. Password must include at least one number\n4. Error messages are displayed for invalid fields"
     }
   }
   ```

4. **Initial implementation (Green phase)**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Implementation notes",
       "note": "Implemented basic validation functions with regex patterns:\n- validateEmail uses standard email format regex\n- validatePassword uses strength checking regex\n- Added displayError function to show validation messages"
     }
   }
   ```

5. **Refactoring**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Refactoring",
       "note": "Improved implementation by:\n1. Moving validation to FormValidator class\n2. Adding more detailed error messages\n3. Creating reusable validation hooks\n4. Ensuring validation runs on both change and submit"
     }
   }
   ```

6. **Complete task**:
   ```json
   {
     "tool": "mcp__completeTask",
     "args": {}
   }
   ```

## Best Practices for TDD in issue-cards

### Writing Effective Tests
- **Test behavior, not implementation**: Focus on what the code should do, not how it does it
- **Keep tests small and focused**: Each test should verify a single aspect of functionality
- **Use descriptive test names**: Test names should explain expected behavior clearly
- **Include edge cases**: Test boundary conditions and error paths
- **Follow the AAA pattern**: Arrange (setup), Act (execute), Assert (verify)

### Successful Implementation
- **Write minimal code first**: Only implement what's needed to pass the test
- **Don't skip the refactoring step**: Improving code is a core part of TDD
- **Maintain test independence**: Tests should not depend on other tests
- **Commit after completing the TDD cycle**: Each completed cycle should be a commit

### Documentation
- **Document test scenarios**: Clearly describe what aspects are being tested
- **Record implementation decisions**: Note why you chose specific approaches
- **Document test verification**: Confirm tests fail and pass at appropriate stages

## Using Tag Templates for TDD

issue-cards provides specialized tag templates for facilitating TDD workflows:

### +unit-test Template
Use for component, function, or module level testing:

```
Task: Implement user authentication +unit-test
```

Expands to:
1. Write failing unit tests for the functionality (RED phase)
2. Run the unit tests and verify they fail for the expected reason
3. Implement user authentication (GREEN phase)
4. Run unit tests and verify they now pass
5. Refactor implementation while keeping tests passing (REFACTOR phase)
6. Make sure test coverage meets project requirements

### +integration-test Template
Use for testing how components work together:

```
Task: Implement data synchronization between services +integration-test
```

Expands to:
1. Write failing integration tests for component interactions (RED phase)
2. Run the integration tests and verify they fail as expected
3. Implement data synchronization between services (GREEN phase)
4. Run integration tests and verify they now pass
5. Refactor the implementation while keeping tests passing (REFACTOR phase)
6. Verify component integration in the broader system context

### +e2e-test Template
Use for testing full user flows or application integration:

```
Task: Add user registration flow +e2e-test
```

Expands to:
1. Write failing end-to-end test for user registration (RED phase)
2. Run the test and verify it fails correctly
3. Implement user registration flow (GREEN phase)
4. Run the end-to-end test and verify it passes
5. Refactor implementation while maintaining test passing status (REFACTOR phase)
6. Verify the feature works in the full application context

For comprehensive examples of TDD task structures with various test types and application scenarios, see [TDD Task Examples](../tool-examples/tdd-task-examples.md).

## Common Pitfalls and Solutions

| Pitfall | Solution |
|---------|----------|
| Writing tests after implementation | Use the +unit-test or +e2e-test tag templates to enforce test-first approach |
| Tests that are too broad/vague | Break down into smaller, more specific test cases |
| Skipping the refactoring phase | Allocate dedicated time for refactoring in each TDD cycle |
| Test failures due to environment issues | Document setup requirements and maintain consistent test environments |
| Writing tests that depend on implementation | Focus on testing behavior and outputs, not internal details |

## Tips
- Start with a simple test case and progressively add complexity
- Run tests frequently during implementation
- Use test feedback to guide your implementation decisions
- Document both successful and failed approaches for future reference
- Break complex features into smaller, testable chunks
- Use consistent naming patterns for test files and functions
- Consider test performance to maintain a fast feedback cycle

## Creating Task Sequences

For detailed guidance on creating properly structured TDD task sequences, see [TDD Task Sequences](../best-practices/tdd-task-sequences.md) in the best practices documentation. This resource provides patterns, templates, and best practices for organizing tasks in a way that supports Test-Driven Development.

## MCP Command Examples

For comprehensive examples of MCP commands for implementing TDD workflows, see [TDD MCP Examples](../../reference/tdd-mcp-examples.md) in the reference documentation. This resource provides detailed examples of MCP command sequences for unit testing, integration testing, and end-to-end testing scenarios.