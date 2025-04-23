// ABOUTME: AI-specific documentation for developers in issue-cards
// ABOUTME: Contains role guidance, workflow recommendations, and best practices

# Developer Onboarding

## Introduction
As a developer using issue-cards, you'll be implementing tasks, documenting your work, and collaborating on issue tracking. The system provides tools to help you track your progress, document implementation decisions, and share information with your team.

## Recommended Workflows
- [Task Management](../workflows/task-management.md) - For working through assigned tasks
- [Bugfix Workflow](../workflows/bugfix.md) - For fixing issues in the codebase
- [Feature Implementation](../workflows/create-feature.md) - For contributing to feature development

## Best Practices
- **Document failed approaches**: Record approaches that didn't work to prevent others from making the same mistakes
- **Break down complex tasks**: If a task is too large, consider splitting it into smaller sub-tasks
- **Add implementation notes**: Document important technical decisions in the Planned approach section
- **Ask clarifying questions**: If requirements are unclear, use the Questions section
- **Complete tasks sequentially**: Focus on one task at a time for better tracking
- **Include tests**: Write appropriate tests for your implementations
- **Update documentation**: Keep documentation in sync with implementation changes

## Tool Usage Map
- **Get your current task**: Use `mcp__getCurrentTask` to see what you should work on
  ```json
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
  ```

- **Complete a task**: Use `mcp__completeTask` when you've finished your current task
  ```json
  {
    "tool": "mcp__completeTask",
    "args": {}
  }
  ```

- **Add a question**: Use `mcp__addQuestion` when you need clarification
  ```json
  {
    "tool": "mcp__addQuestion",
    "args": {
      "question": "Should the user password have minimum complexity requirements?"
    }
  }
  ```

- **Document implementation details**: Use `mcp__addNote` to record important information
  ```json
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "Using bcrypt for password hashing with a work factor of 12"
    }
  }
  ```

- **Record failed approaches**: Use `mcp__logFailure` to document what didn't work
  ```json
  {
    "tool": "mcp__logFailure",
    "args": {
      "approach": "Tried using localStorage for token storage",
      "reason": "Vulnerable to XSS attacks"
    }
  }
  ```

- **Find available tag templates**: Use `mcp__availableTags` to discover standardized workflows
  ```json
  {
    "tool": "mcp__availableTags",
    "args": {}
  }
  ```

## Working with Tag Templates

Tag templates are standardized task workflows that expand into multiple steps when using the `+tag-name` syntax in task descriptions. When assigned a task with a tag template, you'll see the expanded steps that should be followed in order.

### Common Developer Tag Templates

- **+unit-test**: Test-Driven Development workflow
  1. Write failing tests for the feature
  2. Implement code to pass the tests 
  3. Refactor while maintaining test coverage

- **+e2e-test**: End-to-end testing workflow
  1. Design test scenarios for the feature
  2. Implement end-to-end tests
  3. Implement the feature to pass tests
  4. Verify test coverage is adequate

- **+lint-and-commit**: Code quality workflow
  1. Run linting tools on your changes
  2. Fix any style or quality issues
  3. Run tests to verify nothing is broken
  4. Commit your changes with a descriptive message

When completing tasks that use tag templates, make sure to follow the workflow steps in order for best results.