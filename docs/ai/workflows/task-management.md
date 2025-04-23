// ABOUTME: AI-specific workflow documentation for task management
// ABOUTME: Contains step-by-step instructions and tool examples

# Task Management Workflow

## Overview
This workflow guides you through the process of managing and completing tasks in issue-cards, focusing on individual task progression.

## Steps
1. Check your current task using `mcp__getCurrentTask`
2. If any aspects are unclear, add questions using `mcp__addQuestion`
3. Document your implementation approach using `mcp__addNote`
4. If you try an approach that doesn't work, log it with `mcp__logFailure`
5. When you complete the task, mark it as done with `mcp__completeTask`
6. Review the next task and continue the process

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

## Tips
- Focus on one task at a time rather than switching between multiple tasks
- Document your approach before implementation to clarify your thinking
- Ask questions early rather than making assumptions
- Check the Problem section for context before implementing
- Break down complex tasks into smaller steps in your implementation
- Include detailed information in failure logs to help others learn
- Add implementation notes with specific technical details
- Mark tasks as complete as soon as they're finished
- If a task is too large or unclear, consider asking for it to be broken down
- Look for tag templates that can add structure to your implementation process