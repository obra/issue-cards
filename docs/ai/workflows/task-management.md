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