// ABOUTME: AI-specific workflow documentation for reviewing issues and tasks
// ABOUTME: Contains step-by-step instructions and tool examples

# Review Workflow

## Overview
This workflow guides you through the process of reviewing completed or in-progress issues and providing structured feedback.

## Steps
1. List issues with `mcp__listIssues` to find items to review
2. View the detailed issue with `mcp__showIssue`
3. Review the issue's tasks, notes, and failed approaches
4. Add feedback with `mcp__addNote` to relevant sections
5. Add follow-up questions with `mcp__addQuestion` if clarification is needed
6. Create additional tasks with `mcp__addTask` for any outstanding work
7. Summarize review findings in a final note

## Example Tool Sequence
```json
[
  { 
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  },
  {
    "tool": "mcp__showIssue",
    "args": { "issueNumber": "0001" }
  },
  {
    "tool": "mcp__addNote",
    "args": {
      "issueNumber": "0001",
      "section": "Planned approach",
      "note": "The implementation approach looks good, but consider adding rate limiting to prevent brute force attacks"
    }
  },
  {
    "tool": "mcp__addQuestion",
    "args": {
      "issueNumber": "0001",
      "question": "Has this implementation been tested with large datasets?"
    }
  },
  {
    "tool": "mcp__addTask",
    "args": {
      "issueNumber": "0001",
      "description": "Add rate limiting to authentication endpoints #security"
    }
  }
]
```

## Tips
- Check if all tasks have been completed or have clear status
- Verify that the implementation matches the original problem statement
- Look for proper test coverage in the task list
- Examine failed approaches to understand implementation choices
- Check that questions have been addressed or answered
- Be specific in feedback, pointing to exact areas for improvement
- Suggest concrete improvements rather than vague criticisms
- Look for potential edge cases that might not be handled
- Consider security, performance, and usability aspects
- Group related feedback in a single note when possible