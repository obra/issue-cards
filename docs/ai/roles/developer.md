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