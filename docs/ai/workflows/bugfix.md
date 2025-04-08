// ABOUTME: AI-specific workflow documentation for bug fixing
// ABOUTME: Contains step-by-step instructions and tool examples

# Bugfix Workflow

## Overview
This workflow guides you through the process of documenting, implementing, and verifying bug fixes using issue-cards.

## Steps
1. Create a new bugfix issue using `mcp__createIssue` with the bugfix template
2. Add detailed steps to reproduce the bug in the problem description
3. Add tasks for reproduction, investigation, fix implementation, and testing
4. Set the issue as current using `mcp__setCurrentIssue`
5. Work through tasks systematically using `mcp__getCurrentTask` and `mcp__completeTask`
6. Document failed approaches with `mcp__logFailure`
7. Add implementation notes using `mcp__addNote`
8. Complete all tasks when the bug is fixed and verified

## Example Tool Sequence
```json
[
  { 
    "tool": "mcp__createIssue",
    "args": {
      "template": "bugfix",
      "title": "Fix dropdown menu not working on mobile",
      "problem": "The dropdown menu doesn't respond to touch events on mobile devices. Steps to reproduce:\n1. Open the application on a mobile device\n2. Navigate to the dashboard\n3. Tap on the settings dropdown\n4. The dropdown does not open",
      "task": [
        "Reproduce the issue on multiple mobile devices",
        "Identify the cause of the touch event issue",
        "Fix the event handler for touch events #unit-test",
        "Verify fix on multiple mobile devices #e2e-test"
      ]
    }
  },
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0002" }
  },
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  },
  {
    "tool": "mcp__logFailure",
    "args": {
      "approach": "Tried adding touchstart event but it creates double-trigger on desktop",
      "reason": "The event fires twice on desktop when both click and touchstart are active"
    }
  },
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "Using feature detection to apply different event handlers on mobile vs desktop"
    }
  },
  {
    "tool": "mcp__completeTask",
    "args": {}
  }
]
```

## Tips
- Always include detailed reproduction steps in the problem description
- Note the environment where the bug occurs (browser version, device, etc.)
- Document your investigation process to help with similar bugs
- Include test cases that verify the fix works and won't regress
- When logging failed approaches, explain why they didn't work
- Add specific conditions to be tested in verification tasks
- Consider edge cases in your implementation
- Add information about root causes to help prevent similar bugs