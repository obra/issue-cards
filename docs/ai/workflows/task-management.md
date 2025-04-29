// ABOUTME: AI-specific workflow documentation for task management
// ABOUTME: Contains step-by-step instructions and tool examples

# Task Management Workflow

## Overview
This workflow guides you through the process of managing and completing tasks in issue-cards, focusing on individual task progression and navigation between issues and tasks.

## Basic Task Workflow
1. Check your current task using `mcp__getCurrentTask`
2. If any aspects are unclear, add questions using `mcp__addQuestion`
3. Document your implementation approach using `mcp__addNote`
4. If you try an approach that doesn't work, log it with `mcp__logFailure`
5. When you complete the task, mark it as done with `mcp__completeTask`
6. Review the next task and continue the process

## Navigating Between Issues and Tasks

### Issue Navigation
1. View all available issues using `mcp__listIssues` (with optional state filter)
2. Examine a specific issue with `mcp__showIssue` to see all its tasks and details
3. Set your working issue with `mcp__setCurrentIssue` to establish context
4. Begin task work by getting the current task with `mcp__getCurrentTask`

### Task Navigation
1. Always start work by checking the current task with `mcp__getCurrentTask`
2. After completing a task, use `mcp__completeTask` to move to the next task
3. The next task will be returned automatically - review it and begin work
4. When all tasks in an issue are complete, you'll be informed the issue is closed

### Multi-Issue Navigation Pattern
```
┌───────────────────┐
│ mcp__listIssues   │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ mcp__setCurrentIssue
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ mcp__getCurrentTask│◄────┐
└─────────┬─────────┘     │
          ▼               │
┌───────────────────┐     │
│ Work on task      │     │
└─────────┬─────────┘     │
          ▼               │
┌───────────────────┐     │
│ mcp__completeTask │─────┘
└─────────┬─────────┘
          │
          ▼
    ┌─────────────┐
    │More tasks?  │───Yes─┐
    └─────┬───────┘       │
          │No            │
          ▼              │
┌───────────────────┐    │
│ mcp__listIssues   │    │
└─────────┬─────────┘    │
          ▼              │
┌───────────────────┐    │
│ mcp__setCurrentIssue   │
└─────────┬─────────┘    │
          │              │
          └──────────────┘
```

## Example Tool Sequence
```json
[
  { 
    "tool": "mcp__getCurrentTask",
    "args": {}
  },
  {
    "tool": "mcp__addQuestion",
    "args": { 
      "question": "Should we detect device type or use a single event type for all devices?"
    }
  },
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "Using feature detection with window.TouchEvent to determine if touch events should be used"
    }
  },
  {
    "tool": "mcp__logFailure",
    "args": {
      "approach": "Tried adding touchstart event but it creates double-trigger on desktop",
      "reason": "The event fires twice on desktop when both click and touchstart are active"
    }
  },
  {
    "tool": "mcp__completeTask",
    "args": {}
  }
]
```

## Working with Tag Templates

Tasks may include standardized workflows through tag templates, which are denoted by the `+tag-name` syntax. When a task uses a tag template, it will automatically expand into a series of structured subtasks to follow.

### Viewing Available Tag Templates

To see all available tag templates with their descriptions:

```json
{
  "tool": "mcp__availableTags",
  "args": {}
}
```

### Example: Task with Unit Test Template

Task description: "Implement user registration form +unit-test"

This will expand to:
1. Write failing tests for user registration
2. Implement the registration form to pass tests
3. Refactor while maintaining test coverage

When working with tag templates, complete each expanded step in order, marking each as complete as you finish.

## Navigation Scenarios

### Scenario 1: Starting Work on a New Project

```json
[
  // 1. List all available issues
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  },
  
  // 2. Set the first issue as current
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0001" }
  },
  
  // 3. Get the current task to work on
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

### Scenario 2: Completing a Task and Moving to the Next

```json
[
  // 1. Complete the current task
  {
    "tool": "mcp__completeTask",
    "args": {}
  },
  
  // 2. Review the next task (returned by completeTask)
  // 3. Begin work on the next task
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "Approach for the next task..."
    }
  }
]
```

### Scenario 3: Moving to a Different Issue

```json
[
  // 1. List all available issues
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  },
  
  // 2. Set a different issue as current
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0002" }
  },
  
  // 3. Get the current task in the new issue
  {
    "tool": "mcp__getCurrentTask", 
    "args": {}
  }
]
```

### Scenario 4: Handling Task Completion When All Tasks are Finished

```json
[
  // 1. Complete the final task
  {
    "tool": "mcp__completeTask",
    "args": {}
  },
  
  // 2. System returns indication that all tasks are complete
  // Response will include: "issueCompleted": true, "nextTask": null
  
  // 3. Find a new issue to work on
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  },
  
  // 4. Set the next issue as current
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0003" }
  }
]
```

## Navigation Best Practices
- Always follow the task order - tasks are designed to be completed sequentially
- Use `mcp__getCurrentTask` after any navigation action to ensure proper context
- Never assume the current state - always check explicitly
- When switching issues, review the issue context to understand the new context
- Follow the workflow guidance provided in each command response
- Maintain clear documentation when moving between issues
- Focus on one task at a time rather than trying to work on multiple tasks
- When navigating between multiple issues, maintain a mental model of the overall project structure

## General Task Management Tips
- Document your approach before implementation to clarify your thinking
- Ask questions early rather than making assumptions
- Check the Problem section for context before implementing
- Break down complex tasks into smaller steps in your implementation
- Include detailed information in failure logs to help others learn
- Add implementation notes with specific technical details
- Mark tasks as complete as soon as they're finished
- If a task is too large or unclear, consider asking for it to be broken down
- Look for tag templates that can add structure to your implementation process
- For more detailed navigation guidance, see the [Ticket Navigation](../../reference/ticket-navigation.md) guide