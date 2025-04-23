// ABOUTME: AI-specific documentation for project managers in issue-cards
// ABOUTME: Contains role guidance, workflow recommendations, and best practices

# Project Manager Onboarding

## Introduction
As a project manager using issue-cards, you'll be responsible for creating and organizing issues, defining tasks, and tracking progress. The system provides tools to help you plan work, document requirements, and monitor team progress.

## Recommended Workflows
- [Create Feature Issue](../workflows/create-feature.md) - For planning and tracking new features
- [Bugfix Workflow](../workflows/bugfix.md) - For managing bug fixes
- [Technical Audit](../workflows/audit.md) - For conducting technical reviews
- [Task Management](../workflows/task-management.md) - For organizing and tracking work items

## Best Practices
- **Define clear problem statements**: Make sure each issue has a well-defined problem to solve
- **Break work into small tasks**: Tasks should be completable in 1-2 hours
- **Include success criteria**: Define what "done" looks like for each task
- **Add context information**: Provide relevant background information to help developers
- **Identify questions early**: Use the Questions section to capture unknowns
- **Use tag templates**: Add standardized workflows to tasks with the `+tag-name` syntax (e.g., `+unit-test`, `+e2e-test`)
- **Discover available tags**: Use `mcp__availableTags` to see available tag templates with descriptions
- **Prioritize tasks**: Order tasks logically by dependency and complexity
- **Document decisions**: Use notes to capture important design decisions

## Tool Usage Map
- **Creating issues**: Use `mcp__createIssue` with template, title, and problem
  ```json
  {
    "tool": "mcp__createIssue",
    "args": {
      "template": "feature",
      "title": "Implement user authentication",
      "problem": "Users need to securely log in to the application",
      "approach": "Use JWT-based authentication with secure password hashing"
    }
  }
  ```

- **Viewing all issues**: Use `mcp__listIssues` to see project status
  ```json
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  }
  ```

- **Adding tasks**: Use `mcp__addTask` to expand existing issues
  ```json
  {
    "tool": "mcp__addTask",
    "args": {
      "issueNumber": "0001",
      "description": "Design user authentication schema"
    }
  }
  ```

- **Examining issues**: Use `mcp__showIssue` to view detailed information
  ```json
  {
    "tool": "mcp__showIssue",
    "args": { "issueNumber": "0001" }
  }
  ```

- **Setting current issue**: Use `mcp__setCurrentIssue` to focus on specific work
  ```json
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0001" }
  }
  ```

- **Discovering tag templates**: Use `mcp__availableTags` to see available workflow templates
  ```json
  {
    "tool": "mcp__availableTags",
    "args": {}
  }
  ```

## Using Tag Templates

Tag templates provide standardized task workflows that can be added to any task description using the `+tag-name` syntax. When you add a tag to a task, it will automatically expand into multiple sub-tasks.

### Example: Adding a unit test workflow to a task

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Implement login form validation +unit-test"
  }
}
```

This will create a task with TDD workflow steps:
1. Write failing tests for login validation
2. Implement validation logic to pass tests
3. Refactor validation code while maintaining test coverage

### Common Tag Templates

- **+unit-test**: Test-Driven Development workflow for unit testing
- **+e2e-test**: End-to-end testing workflow for feature validation
- **+lint-and-commit**: Code quality checks before committing
- **+update-docs**: Documentation update workflow