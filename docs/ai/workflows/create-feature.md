// ABOUTME: AI-specific workflow documentation for creating feature issues
// ABOUTME: Contains step-by-step instructions and tool examples

# Create Feature Issue Workflow

## Overview
This workflow guides you through creating a well-structured feature issue in issue-cards. Use this when planning and implementing new functionality.

## Steps
1. Check available templates using `mcp__listTemplates` with `type: "issue"`
2. Create new feature issue using `mcp__createIssue` with the feature template
3. Add detailed tasks using `mcp__addTask` for each work item
4. Verify the issue was created successfully with `mcp__listIssues`

## Example Tool Sequence
```json
[
  { 
    "tool": "mcp__listTemplates",
    "args": { "type": "issue" }
  },
  { 
    "tool": "mcp__createIssue",
    "args": {
      "template": "feature",
      "title": "Implement user authentication",
      "problem": "Users need to securely log in to the application",
      "approach": "Use JWT-based authentication with secure password hashing",
      "task": [
        "Research authentication libraries",
        "Design user schema",
        "Implement login endpoint",
        "Add token validation middleware",
        "Create login form UI"
      ]
    }
  },
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  }
]
```

## Tips
- Use descriptive, action-oriented issue titles
- Focus the problem statement on user/business needs, not implementation
- Order tasks logically by dependency and complexity
- Include research tasks before implementation tasks
- Add testing tasks with appropriate tags (e.g., `#unit-test`, `#e2e-test`)
- Keep tasks small and focused (1-2 hours of work per task)
- Include clear success criteria in the problem statement
- Document any known constraints or requirements