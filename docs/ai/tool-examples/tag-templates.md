// ABOUTME: Comprehensive documentation for using tag templates in issue-cards
// ABOUTME: Includes discovery, usage examples, and best practices

# Tag Templates Guide

## Overview

Tag templates provide standardized task workflows that can be added to any task using the `+tag-name` syntax. When a tag is added to a task description, it automatically expands into multiple structured subtasks that follow best practices for that workflow type.

## Discovering Available Templates

You can view all available tag templates and their descriptions using the `mcp__availableTags` tool:

```json
{
  "tool": "mcp__availableTags",
  "args": {}
}
```

This returns a list of all tag templates with:
- Template name
- Description of what the template does
- Usage examples

## Adding Tags to Tasks

Tags are added to task descriptions using the `+tag-name` syntax at the end of the description:

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Implement user authentication +unit-test"
  }
}
```

This will create a task that automatically expands to include the steps defined in the unit-test template.

## Available Tag Templates

### Unit Testing (+unit-test)

The unit-test template provides a Test-Driven Development (TDD) workflow:

```
+unit-test
```

Expands to:
1. Write failing unit tests for the feature
2. Implement code to pass the tests
3. Refactor while maintaining test coverage

Ideal for: Core business logic, utility functions, and any code that needs thorough test coverage.

### End-to-End Testing (+e2e-test)

The e2e-test template focuses on comprehensive testing of features from a user perspective:

```
+e2e-test
```

Expands to:
1. Design test scenarios covering critical user flows
2. Implement end-to-end tests for the feature
3. Implement the feature to pass the tests
4. Verify edge cases are properly handled

Ideal for: User-facing features, complex workflows, and cross-component functionality.

### Code Quality (+lint-and-commit)

The lint-and-commit template ensures code quality standards are met before committing:

```
+lint-and-commit
```

Expands to:
1. Run linting tools on your changes
2. Fix any style or quality issues
3. Run tests to verify nothing is broken
4. Commit your changes with a descriptive message

Ideal for: Final review before submitting code, ensuring consistent code style.

### Documentation (+update-docs)

The update-docs template provides a workflow for keeping documentation up-to-date:

```
+update-docs
```

Expands to:
1. Update relevant documentation files
2. Ensure examples are accurate and working
3. Update any related diagrams or images
4. Cross-reference with other documentation

Ideal for: API changes, new features, or any change that affects user-facing documentation.

## Best Practices

1. **Choose the appropriate template** based on the task requirements
2. **Complete all subtasks** in the expanded template
3. **Follow the order of steps** as they are designed to build on each other
4. **Consider combining templates** for complex tasks (e.g., `+unit-test +update-docs`)
5. **Use consistent naming** to ensure tasks are properly expanded

## Examples

### Implementing a New Feature with Testing

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Add password reset functionality +unit-test +e2e-test"
  }
}
```

This will create a task that includes both unit testing and end-to-end testing workflows.

### Fixing a Bug with Documentation Update

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Fix incorrect error messages in login form +unit-test +update-docs"
  }
}
```

This will create a task that includes both unit testing and documentation update workflows.

## Creating Custom Templates

Project maintainers can create custom tag templates by adding new `.md` files to the `/templates/tag/` directory. Each template should include:

1. A clear title
2. A description (using blockquote format)
3. A list of steps in the workflow

Example template structure:

```markdown
# Custom Workflow

> Brief description of what this workflow accomplishes

## Steps

- First step to complete
- Second step to complete
- Final step to complete
```