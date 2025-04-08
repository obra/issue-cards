// ABOUTME: AI-specific documentation for reviewers in issue-cards
// ABOUTME: Contains role guidance, workflow recommendations, and best practices

# Reviewer Onboarding

## Introduction
As a reviewer using issue-cards, you'll be responsible for assessing completed work, providing feedback, and ensuring quality standards are met. The system provides tools to help you examine issues, add feedback, and create follow-up tasks when needed.

## Recommended Workflows
- [Review Process](../workflows/review.md) - For reviewing completed issues
- [Technical Audit](../workflows/audit.md) - For conducting technical assessments
- [Task Management](../workflows/task-management.md) - For tracking review tasks

## Best Practices
- **Check task completeness**: Verify that all tasks have been completed according to requirements
- **Validate documentation**: Ensure that implementation is properly documented
- **Review failed approaches**: Check that failed approaches are documented with clear reasons
- **Confirm questions are resolved**: Make sure all questions have been addressed
- **Verify test coverage**: Check that appropriate tests have been included
- **Provide constructive feedback**: Add notes with clear, actionable feedback
- **Create follow-up tasks**: When issues need additional work, add specific tasks

## Tool Usage Map
- **List issues to review**: Use `mcp__listIssues` to find completed issues
  ```json
  {
    "tool": "mcp__listIssues",
    "args": { "state": "closed" }
  }
  ```

- **Examine an issue**: Use `mcp__showIssue` to see the full details
  ```json
  {
    "tool": "mcp__showIssue",
    "args": { "issueNumber": "0001" }
  }
  ```

- **Add review feedback**: Use `mcp__addNote` to provide comments
  ```json
  {
    "tool": "mcp__addNote",
    "args": {
      "issueNumber": "0001",
      "section": "Planned approach",
      "note": "The approach is sound, but needs additional error handling for edge cases"
    }
  }
  ```

- **Create follow-up tasks**: Use `mcp__addTask` for work that still needs to be done
  ```json
  {
    "tool": "mcp__addTask",
    "args": {
      "issueNumber": "0001",
      "description": "Add error handling for network timeouts"
    }
  }
  ```

- **Ask for clarification**: Use `mcp__addQuestion` when you need more information
  ```json
  {
    "tool": "mcp__addQuestion",
    "args": {
      "issueNumber": "0001",
      "question": "Was performance testing done for large datasets?"
    }
  }
  ```