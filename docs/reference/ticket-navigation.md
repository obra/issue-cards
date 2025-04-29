// ABOUTME: Documentation for navigating between tickets and tasks in MCP workflows
// ABOUTME: Contains comprehensive guide for ticket/task navigation with examples

# MCP Workflow Navigation

## Overview

This document explains how to navigate between tickets (issues) and tasks using the Model-Code-Prompt (MCP) tools in issue-cards. Proper navigation ensures AI assistants and developers can efficiently move between different issues and tasks, maintaining context and following structured workflows.

## Ticket Navigation Principles

When working with issue-cards, navigation follows these core principles:

1. **Current Issue Focus**: Work is performed on the "current issue"
2. **Task Sequence**: Tasks are completed in sequential order
3. **Explicit Transitions**: Moving between issues and tasks should be explicit
4. **Context Preservation**: Context is maintained when navigating
5. **Guided Workflow**: Navigation guidance is provided at each step

## Navigating Between Issues

### Listing Available Issues

To see all available issues, use the `mcp__listIssues` tool:

```json
{
  "tool": "mcp__listIssues",
  "args": { 
    "state": "open" // Optional: "open" (default), "closed", or "all"
  }
}
```

This returns a list of issues with their numbers, titles, and other metadata, which includes workflow guidance on what to do next:

```json
{
  "success": true,
  "data": [
    {
      "issueNumber": "0001",
      "title": "Implement authentication system",
      "status": "open",
      "tasks": [
        { "description": "Research authentication options", "completed": true },
        { "description": "Implement JWT authentication", "completed": false }
      ]
    },
    {
      "issueNumber": "0002",
      "title": "Fix user profile display bug",
      "status": "open",
      "tasks": [
        { "description": "Reproduce the bug", "completed": false }
      ]
    }
  ],
  "workflowGuidance": {
    "message": "IMPORTANT: After selecting an issue to work on, use mcp__getCurrentTask to get your current task rather than trying to implement all tasks at once.",
    "recommendedWorkflow": "For proper task workflow: 1) Use mcp__getCurrentTask to get your current task, 2) Implement ONLY that specific task, 3) Use mcp__completeTask when done to mark it complete and receive the next task.",
    "nextSteps": [
      "1️⃣ Choose an issue to work on from the list above",
      "2️⃣ Use mcp__setCurrentIssue with the issue number to set it as your current issue",
      "3️⃣ Use mcp__getCurrentTask to see the first task to implement"
    ],
    "exampleCommands": [
      {
        "description": "Set an issue as current",
        "command": {
          "tool": "mcp__setCurrentIssue",
          "args": { "issueNumber": "[ISSUE_NUMBER]" }
        }
      },
      {
        "description": "View your current task",
        "command": {
          "tool": "mcp__getCurrentTask",
          "args": {}
        }
      }
    ]
  }
}
```

### Viewing an Issue's Details

To view a specific issue, use `mcp__showIssue`:

```json
{
  "tool": "mcp__showIssue",
  "args": { 
    "issueNumber": "0001" 
  }
}
```

This returns detailed information about the issue, including all tasks, sections, and workflow guidance:

```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "title": "Implement authentication system",
    "content": "# Issue 0001: Implement authentication system\n\n...",
    "currentTaskInfo": {
      "id": "task-2",
      "description": "Implement JWT authentication",
      "message": "Use mcp__getCurrentTask to focus on implementing this specific task."
    },
    "workflowGuidance": {
      "message": "⚠️ This command provides a reference view of the entire issue. For actual implementation work, follow the task-by-task approach below.",
      "nextSteps": [
        "1️⃣ Set this issue as your current issue (if not already)",
        "2️⃣ Use mcp__getCurrentTask to see your specific assigned task",
        "3️⃣ Document your approach with mcp__addNote before implementation",
        "4️⃣ Mark task complete with mcp__completeTask when finished"
      ],
      "exampleCommands": [
        {
          "description": "Set this issue as current",
          "command": {
            "tool": "mcp__setCurrentIssue",
            "args": { "issueNumber": "0001" }
          }
        },
        {
          "description": "Get your current task",
          "command": {
            "tool": "mcp__getCurrentTask",
            "args": {}
          }
        }
      ]
    }
  }
}
```

### Setting the Current Issue

To set the current issue you want to work on, use `mcp__setCurrentIssue`:

```json
{
  "tool": "mcp__setCurrentIssue",
  "args": { 
    "issueNumber": "0001" 
  }
}
```

This sets the specified issue as current, allowing you to work on its tasks:

```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "message": "Set current issue to 0001"
  }
}
```

After setting the current issue, you should immediately use `mcp__getCurrentTask` to see what task you should be working on.

## Navigating Between Tasks

### Getting the Current Task

To see your current task within the current issue, use `mcp__getCurrentTask`:

```json
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

This returns information about the current task to work on, along with relevant context and workflow guidance:

```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "issueTitle": "Implement authentication system",
    "taskId": "task-2",
    "description": "Implement JWT authentication",
    "context": {
      "problem": "Users need a secure way to authenticate with the application",
      "approach": "Use JWT tokens with secure storage and proper expiration"
    },
    "workflowGuidance": {
      "message": "🎯 Focus on implementing ONLY this task, following best practices.",
      "implementationSteps": [
        "1️⃣ Document your implementation plan with mcp__addNote",
        "2️⃣ Record questions or unclear requirements with mcp__addQuestion",
        "3️⃣ Document any failed approaches with mcp__logFailure",
        "4️⃣ Mark task complete with mcp__completeTask when finished"
      ],
      "exampleCommands": [
        {
          "description": "Document implementation approach",
          "command": {
            "tool": "mcp__addNote",
            "args": {
              "section": "Planned approach",
              "note": "[Your implementation approach here]"
            }
          }
        },
        {
          "description": "Ask a clarifying question",
          "command": {
            "tool": "mcp__addQuestion",
            "args": {
              "question": "[Your question about requirements or implementation]"
            }
          }
        }
      ]
    }
  }
}
```

### Moving to the Next Task

To mark the current task as complete and move to the next task, use `mcp__completeTask`:

```json
{
  "tool": "mcp__completeTask",
  "args": {}
}
```

This completes the current task and returns information about the next task to work on:

```json
{
  "success": true,
  "data": {
    "taskCompleted": "Implement JWT authentication",
    "issueNumber": "0001",
    "nextTask": {
      "id": "task-3",
      "description": "Create login form component"
    },
    "workflowGuidance": {
      "message": "✅ Great job completing the previous task! Now focus on the next task below.",
      "progressUpdate": "Task task-3 of the issue is now ready to implement.",
      "implementationSteps": [
        "1️⃣ Take time to understand this task before implementation",
        "2️⃣ Document your implementation plan with mcp__addNote",
        "3️⃣ Implement the solution, documenting decisions as you go",
        "4️⃣ Mark task complete with mcp__completeTask when finished"
      ]
    }
  }
}
```

### Handling Task Completion

When all tasks in an issue are completed, `mcp__completeTask` will indicate issue completion:

```json
{
  "success": true,
  "data": {
    "taskCompleted": "Create documentation for authentication API",
    "issueNumber": "0001",
    "nextTask": null,
    "issueCompleted": true,
    "message": "🎉 All tasks in this issue have been completed! The issue has been closed."
  }
}
```

After completing all tasks in an issue, you should:

1. List available issues with `mcp__listIssues`
2. Select the next issue to work on with `mcp__setCurrentIssue`
3. Start the process again with `mcp__getCurrentTask`

## Navigation Flow Diagrams

### Complete Navigation Workflow

```
┌───────────────────┐
│ mcp__listIssues   │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ mcp__setCurrentIssue
└─────────┬─────────┘
          ▼
┌───────────────────┐     ┌───────────────────┐
│ mcp__getCurrentTask│────▶│ mcp__addNote      │
└─────────┬─────────┘     └───────────────────┘
          │                ┌───────────────────┐
          │               ▶│ mcp__addQuestion  │
          │               │└───────────────────┘
          │               │┌───────────────────┐
          │               ▶│ mcp__logFailure   │
          ▼                └───────────────────┘
┌───────────────────┐
│ mcp__completeTask │
└─────────┬─────────┘
          │
          ▼
    ┌─────────────┐        ┌───────────────────┐
    │Next task?   │───Yes─▶│ mcp__getCurrentTask│
    └─────┬───────┘        └───────────────────┘
          │No
          ▼
┌───────────────────┐
│ mcp__listIssues   │
└───────────────────┘
```

### Task Navigation Flow

```
┌───────────────────┐
│ mcp__getCurrentTask│
└─────────┬─────────┘
          │
          ▼
┌──────────────────────────┐
│ Understand task & context │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ mcp__addNote             │
│ (Document planned approach)
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Implement task           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ mcp__completeTask        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Receive next task        │
└──────────────────────────┘
```

## Navigation in Different Workflows

### Test-Driven Development Navigation

When working with TDD-tagged tasks (e.g., `+unit-test`), navigation follows additional TDD-specific guidance:

1. Get the current task with `mcp__getCurrentTask` - you'll receive TDD-specific guidance
2. Document the RED phase (failing tests) with `mcp__addNote` to "Test implementation"
3. Document the GREEN phase (passing implementation) with `mcp__addNote` to "Implementation notes"
4. Document the REFACTOR phase with `mcp__addNote` to "Refactoring"
5. Complete the task with `mcp__completeTask`
6. Navigate to the next task in the TDD sequence

Example TDD guidance in the response:

```json
{
  "workflowGuidance": {
    "tddGuidance": {
      "message": "This task requires Test-Driven Development (Red-Green-Refactor cycle):",
      "tddSteps": [
        "🔴 RED: Write failing tests that define the expected behavior",
        "🟢 GREEN: Write the minimum code necessary to pass the tests",
        "🔄 REFACTOR: Improve the code while keeping tests passing"
      ],
      "documentation": "For detailed TDD guidance, see the 'TDD Workflow' documentation."
    }
  }
}
```

### Bug Fix Navigation

When navigating through a bug fix issue:

1. Use `mcp__getCurrentTask` to see the current bug fixing step
2. Document reproduction steps with `mcp__addNote` to "Problem to be solved"
3. Add test cases demonstrating the bug with `mcp__addNote` to "Test implementation"
4. Document the fix implementation with `mcp__addNote` to "Implementation notes"
5. Complete the task with `mcp__completeTask`
6. Navigate to the next task in the bug fix sequence

## Multi-Issue Navigation Patterns

### Working on Related Issues

When working on related issues:

1. Complete the current issue's tasks with `mcp__completeTask`
2. When complete, use `mcp__listIssues` to find related issues
3. Navigate to a related issue with `mcp__setCurrentIssue`
4. Continue with `mcp__getCurrentTask` on the new issue

### Handling Task Dependencies Across Issues

For tasks with dependencies on other issues:

1. Document cross-issue dependencies with `mcp__addNote`
2. Use `mcp__addQuestion` to clarify dependency relationships
3. If blocked by another issue, document this with `mcp__logFailure`
4. When needed, navigate to the dependency issue with `mcp__setCurrentIssue`

## Best Practices for Navigation

1. **Complete Current Tasks**: Always complete the current task before moving to the next
2. **Follow Sequential Order**: Tasks are designed to be completed in order
3. **Document Context Transitions**: When switching issues, document relevant context
4. **Use Explicit Navigation**: Always use explicit navigation tools, never assume current state
5. **Check Task Context**: When navigating to a new task, review its context first
6. **Maintain Workflow Progress**: Follow the workflow guidance provided in each command response
7. **Verify State Changes**: After navigation, verify the new state is what you expect

## Common Navigation Scenarios

### Scenario 1: Starting Work on a Project

```json
[
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  },
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0001" }
  },
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

### Scenario 2: Completing a Task and Moving to the Next

```json
[
  {
    "tool": "mcp__completeTask",
    "args": {}
  },
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

### Scenario 3: Completing an Issue and Moving to Another

```json
[
  {
    "tool": "mcp__completeTask",
    "args": {}
  },
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  },
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0002" }
  },
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

## Handling Navigation Errors

### Common Error Types

1. **NotFoundError**: Issue or task not found (invalid issue number)
2. **UserError**: No current issue set when trying to get current task
3. **SectionNotFoundError**: When adding notes to non-existent sections
4. **ValidationError**: Invalid parameters in navigation commands

### Error Recovery Strategies

If you encounter navigation errors:

1. For "No current issue" errors: Use `mcp__listIssues` followed by `mcp__setCurrentIssue`
2. For "Issue not found" errors: Check the issue number and use `mcp__listIssues` to get valid numbers
3. For other errors: Follow the guidance provided in the error message

Example error response:

```json
{
  "success": false,
  "error": {
    "type": "NotFoundError",
    "message": "Issue 0099 not found"
  }
}
```

## Conclusion

Proper navigation between tickets and tasks is crucial for maintaining context and following structured workflows. Always use the explicit navigation commands to move between issues and tasks, and follow the workflow guidance provided in each command response.

For more detailed information about individual MCP tools, see the [MCP Tool Reference](mcp-tool-reference.md) document. For complete workflow examples, see the [Ticket Creation Workflow](../ai/workflows/ticket-creation-workflow.md) guide.