// ABOUTME: Guidance for creating effective TDD task sequences
// ABOUTME: Includes patterns, examples, and best practices for test-driven development

# TDD Task Sequence Patterns

## Overview

This guide provides patterns and helpers for creating Test-Driven Development (TDD) task sequences in issue-cards. Following these patterns ensures consistent application of TDD principles across your project and helps maintain the Red-Green-Refactor cycle.

## Basic TDD Task Sequence Pattern

The fundamental pattern for TDD tasks follows this structure:

1. Test task (RED phase)
2. Implementation task (GREEN phase)
3. Refactor task (REFACTOR phase)

When creating tasks for a feature, use this pattern to ensure proper test-first development:

```
Write tests for user authentication functionality +unit-test
Implement user authentication based on tests
Refactor user authentication while maintaining test coverage
```

## Using Tag Templates to Generate TDD Sequences

The simplest way to create a proper TDD sequence is to use the built-in tag templates:

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Implement user authentication +unit-test"
  }
}
```

This automatically expands to the proper TDD sequence:

1. Write failing unit tests for the functionality (RED phase)
2. Run the unit tests and verify they fail for the expected reason
3. Implement user authentication (GREEN phase)
4. Run unit tests and verify they now pass
5. Refactor implementation while keeping tests passing (REFACTOR phase)
6. Make sure test coverage meets project requirements

## Creating Multi-Level TDD Task Sequences

For complex features, you may need a hierarchical approach with multiple levels of TDD cycles:

### Component-Based Pattern

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement User Authentication System",
    "problem": "Users need a secure way to authenticate with our system",
    "approach": "Using JWT authentication with secure storage",
    "task": [
      "Design authentication data model +unit-test", 
      "Implement login form component +unit-test",
      "Implement registration form component +unit-test",
      "Create authentication API endpoints +unit-test",
      "Implement authentication service +unit-test",
      "Integrate components into complete authentication flow +integration-test",
      "Implement end-to-end user authentication flow +e2e-test"
    ]
  }
}
```

### Layered Testing Pattern

When building a feature that spans multiple layers of the application:

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Add Product Search Functionality",
    "problem": "Users need to be able to search for products by various criteria",
    "approach": "Implement searchable indexed products with faceted search",
    "task": [
      "Implement search data model and schema +unit-test",
      "Create search index service +unit-test",
      "Implement search query API +unit-test",
      "Integrate search services +integration-test",
      "Create search UI components +unit-test",
      "Connect search UI with backend API +integration-test",
      "Implement complete search experience +e2e-test"
    ]
  }
}
```

## Task Sequence Templates for Common Features

Below are ready-to-use task sequence templates for common feature types:

### CRUD Feature Template

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement [Resource] Management",
    "problem": "Users need to manage [Resource] data in the system",
    "approach": "Create full CRUD functionality for [Resource]",
    "task": [
      "Design [Resource] data model and schema +unit-test",
      "Implement [Resource] repository layer +unit-test",
      "Create [Resource] service layer with business logic +unit-test",
      "Implement [Resource] API endpoints +unit-test",
      "Integrate [Resource] backend services +integration-test",
      "Create [Resource] list component +unit-test",
      "Create [Resource] detail component +unit-test",
      "Create [Resource] edit/create form +unit-test",
      "Implement [Resource] deletion with confirmation +unit-test",
      "Connect [Resource] UI components with API +integration-test",
      "Implement complete [Resource] management flow +e2e-test"
    ]
  }
}
```

### Authentication Feature Template

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement User Authentication",
    "problem": "System needs secure user authentication",
    "approach": "Implement token-based authentication with secure storage",
    "task": [
      "Design user authentication data model +unit-test",
      "Implement user repository with password hashing +unit-test",
      "Create authentication service +unit-test",
      "Implement login/register API endpoints +unit-test",
      "Create session management service +unit-test",
      "Implement authentication middleware +unit-test",
      "Integrate authentication components +integration-test",
      "Create login form component +unit-test",
      "Create registration form component +unit-test",
      "Implement form validation +unit-test",
      "Connect authentication forms with API +integration-test",
      "Create protected route components +unit-test",
      "Implement complete authentication flow +e2e-test"
    ]
  }
}
```

## Special Case: Bug Fixing with TDD

When fixing bugs using TDD, follow this pattern:

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "bugfix",
    "title": "Fix [Bug Description]",
    "problem": "System is experiencing [issue] when [context]",
    "approach": "Applying TDD to identify and fix the underlying issue",
    "task": [
      "Write test that reproduces the bug +unit-test",
      "Fix the bug implementation",
      "Refactor the solution for maintainability",
      "Add regression tests to prevent recurrence +unit-test"
    ]
  }
}
```

## Composing Multiple Test Types

For critical features that require multiple testing approaches, create task sequences that progress from unit tests to integration tests to end-to-end tests:

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Implement payment processing system",
    "task": [
      "Design payment processing data model +unit-test",
      "Implement payment service components +unit-test",
      "Integrate payment processor with order system +integration-test",
      "Create payment UI components +unit-test",
      "Implement complete checkout process +e2e-test"
    ]
  }
}
```

## Best Practices for TDD Task Sequences

1. **Start with test tasks**: Always place test tasks before implementation tasks
2. **Include verification steps**: Explicitly include steps to verify test failures and successes
3. **Balance task granularity**: Tasks should be small enough to complete in a single session but large enough to deliver meaningful value
4. **Use consistent naming patterns**: Follow consistent naming patterns across tasks
5. **Include refactoring explicitly**: Always include a refactoring step after implementation
6. **Tag appropriately**: Use the appropriate test tag templates based on the testing scope
7. **Progress from unit → integration → e2e**: Structure complex features to progress from small unit tests to larger integration and e2e tests

## Helper: Converting Existing Tasks to TDD Pattern

If you have existing tasks that weren't created with TDD in mind, you can convert them using this pattern:

For each implementation task:

1. Insert a test task before it with `+unit-test` or `+integration-test` suffix
2. Add a refactoring task after it
3. Update the original task to reference the tests

Example conversion:

```
Before:
- Implement user authentication
- Create login form

After:
- Write tests for user authentication service +unit-test
- Implement user authentication based on tests
- Refactor user authentication while maintaining test coverage
- Write tests for login form component +unit-test
- Create login form based on tests
- Refactor login form for maintainability
```

## Helper: Testing Level Decision Guide

Use this guide to determine the appropriate testing level for different parts of your application:

| Component Type | Recommended Testing Approach | Example Task |
|----------------|------------------------------|--------------|
| Pure functions | Unit tests | `Implement date formatting utilities +unit-test` |
| UI Components | Unit tests with JSDOM/Testing Library | `Create login form component +unit-test` |
| API Endpoints | Unit and integration tests | `Implement user API endpoints +unit-test +integration-test` |
| Service Interactions | Integration tests | `Integrate authentication with user service +integration-test` |
| Database Access | Integration tests | `Implement user repository with database access +integration-test` |
| User Flows | End-to-end tests | `Implement complete user registration flow +e2e-test` |

## Helper: TDD Task Name Patterns

Consistent task naming improves clarity and helps maintain the TDD workflow:

### Test Tasks (RED Phase)
- `Write tests for [feature/component]`
- `Create test suite for [feature/component]`
- `Design test cases for [feature/component]`
- `Implement test fixtures for [feature/component]`

### Implementation Tasks (GREEN Phase)
- `Implement [feature/component] based on tests`
- `Create [feature/component] to pass tests`
- `Develop [feature/component] according to test specifications`

### Refactoring Tasks (REFACTOR Phase)
- `Refactor [feature/component] while maintaining test coverage`
- `Optimize [feature/component] implementation`
- `Improve [feature/component] code quality and maintainability`

## Conclusion

Following these patterns and helpers ensures that your TDD workflows are consistently applied across projects. By structuring tasks to follow the Red-Green-Refactor cycle explicitly, you ensure that testing remains a primary focus throughout development.