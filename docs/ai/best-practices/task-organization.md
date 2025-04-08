// ABOUTME: AI-specific best practices for task organization
// ABOUTME: Contains guidance for creating and managing tasks effectively

# Task Organization Best Practices

## Task Creation Principles

### Task Size and Scope
- **Keep tasks small**: Each task should be completable in 1-2 hours of focused work
- **Single responsibility**: Tasks should focus on one specific aspect of work
- **Clear completion criteria**: Define what "done" looks like for each task
- **Measurable outcomes**: Tasks should produce a specific, verifiable result

### Task Ordering and Dependencies
- **Logical sequence**: Order tasks by dependency and natural workflow
- **Front-load complex work**: Put challenging tasks earlier in the sequence
- **Group related tasks**: Keep related tasks together for context retention
- **Minimize blockers**: Identify external dependencies and manage them proactively

### Task Descriptions
- **Action-oriented**: Start with a verb that describes the action to take
- **Specific outcome**: Clearly state what should be produced or accomplished
- **Context inclusion**: Provide enough context to understand the purpose
- **Appropriate tags**: Include relevant tags for testing, documentation, etc.

## Example Tool Usage

### Creating Well-Structured Tasks
```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement user authentication",
    "problem": "Users need a secure way to authenticate with our system",
    "task": [
      "Research authentication libraries and select the most appropriate one",
      "Design user schema with proper password storage #unit-test",
      "Implement registration endpoint with validation #unit-test",
      "Implement login endpoint with rate limiting #unit-test",
      "Create authentication middleware for protected routes #unit-test",
      "Implement password reset functionality #e2e-test",
      "Create login and registration UI components",
      "Add client-side form validation for auth forms",
      "Document authentication system #update-docs"
    ]
  }
}
```

### Adding Tasks with Positioning
```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Add automated security scanning for auth endpoints #security",
    "after": true
  }
}
```

### Adding Tasks at Specific Positions
```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Setup authentication testing environment with mocks",
    "at": 1
  }
}
```

## Task Tracking Strategies

### Progression Tracking
- **Complete tasks sequentially**: Mark tasks complete as soon as they're done
- **Update task descriptions**: Clarify tasks as understanding evolves
- **Add context notes**: Document decisions that affect task implementation
- **Record blockers**: Document external dependencies or blockers

### Documentation Within Tasks
- **Link to resources**: Include links to relevant documentation or examples
- **Document decisions**: Record why specific approaches were chosen
- **Note team discussions**: Summarize relevant team discussions that affect the task
- **Add technical details**: Include implementation details that would help others

### Task Refinement
- **Split large tasks**: Divide tasks that are too large or complex
- **Clarify ambiguous tasks**: Rewrite tasks that are unclear or too broad
- **Add missing tasks**: Add tasks for work that was discovered later
- **Reorder when needed**: Adjust task order if dependencies change