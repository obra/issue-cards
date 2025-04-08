# MCP Tool Reference

This document provides detailed reference information for all Model-Code-Prompt (MCP) tools available in Issue Cards.

> **For AI Integration**: We provide specialized [AI documentation](../ai/index.md) with role-specific guidance, workflows, and examples designed for AI consumption through the onboarding tools. For integrating Claude or other AI assistants, see [Claude Integration Examples](../ai/tool-examples/claude-integration.md) and [Advanced Usage Examples](../ai/tool-examples/advanced-usage.md).

## Common Patterns

All MCP tools in Issue Cards follow these consistent patterns:

### Response Format

All tools return a standardized response format:

```javascript
// Success response
{
  "success": true,
  "data": {
    // Tool-specific response data
  }
}

// Error response
{
  "success": false,
  "error": {
    "type": "ErrorType",
    "message": "Human-readable error message"
  }
}
```

### Error Types

Common error types include:

- `ValidationError`: Invalid arguments provided
- `NotFoundError`: Requested resource not found
- `SectionNotFoundError`: Referenced section doesn't exist
- `UserError`: General user error condition

### Command Aliases

For convenience, several commonly used commands have aliases that provide identical functionality with shorter names. These aliases match the CLI command aliases:

| Original Tool      | Alias Tool       |
|--------------------|------------------|
| `mcp__completeTask` | `mcp__complete`  |
| `mcp__addTask`     | `mcp__add`       |
| `mcp__addQuestion` | `mcp__question`  |
| `mcp__logFailure`  | `mcp__failure`   |

The alias tools have identical parameters and behaviors to their original counterparts. You can use either the original or the alias based on your preference.

## Core Issue Management Tools

### mcp__listIssues

Lists all issues in the system, with optional filtering by state.

**Parameters:**
- `state` (optional): Filter by issue state - "open", "closed", or "all" (default: "open")

**Returns:**
- Array of issue objects with number, title, state, and tasks

**Example Request:**
```javascript
{
  "tool": "mcp__listIssues",
  "args": { "state": "open" }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": [
    {
      "issueNumber": "0001",
      "title": "First Issue",
      "state": "open",
      "tasks": [
        { "id": "1", "description": "Task 1", "completed": false },
        { "id": "2", "description": "Task 2", "completed": true }
      ]
    },
    {
      "issueNumber": "0002",
      "title": "Second Issue",
      "state": "open",
      "tasks": []
    }
  ]
}
```

### mcp__showIssue

Shows detailed information about a specific issue.

**Parameters:**
- `issueNumber`: The issue number to show

**Returns:**
- Issue object with number, title, content, tasks, etc.

**Example Request:**
```javascript
{
  "tool": "mcp__showIssue",
  "args": { "issueNumber": "0001" }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "title": "First Issue",
    "state": "open",
    "content": "# Issue 0001: First Issue\n\n## Problem to be solved\n...",
    "tasks": [
      { "id": "1", "description": "Task 1", "completed": false },
      { "id": "2", "description": "Task 2", "completed": true }
    ]
  }
}
```

### mcp__getCurrentTask

Gets the current task with relevant context from the current issue.

**Parameters:**
- None required

**Returns:**
- Current task details with issue context
- If no current issue, returns `null`

**Example Request:**
```javascript
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "issueTitle": "First Issue",
    "taskId": "task-1",
    "description": "Implement the feature",
    "context": {
      "problem": "The problem description from the issue",
      "approach": "The planned approach from the issue",
      "instructions": "Any specific instructions from the issue"
    }
  }
}
```

### mcp__addTask

Adds a new task to a specific issue.

**Parameters:**
- `issueNumber`: The issue to add the task to
- `description`: The task description

**Returns:**
- The newly created task object

**Example Request:**
```javascript
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "New task to be completed"
  }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "id": "task-3",
    "description": "New task to be completed",
    "completed": false,
    "issueNumber": "0001"
  }
}
```

## Task and Issue Creation Tools

### mcp__createIssue

Creates a new issue from a template.

**Parameters:**
- `template`: Template name to use
- `title`: Issue title
- `problem` (optional): Problem description
- `approach` (optional): Planned approach
- `failedApproaches` (optional): Multi-line list of failed approaches
- `questions` (optional): Multi-line list of questions
- `task` (optional): Task or tasks to add (string or array)
- `instructions` (optional): Implementation instructions
- `nextSteps` (optional): Multi-line list of next steps

**Returns:**
- The newly created issue details

**Example Request:**
```javascript
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Add new authentication method",
    "problem": "Users need alternative authentication options",
    "approach": "Implement OAuth2 authentication",
    "task": ["Research OAuth2 libraries", "Create authentication flow"]
  }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "issueNumber": "0003",
    "title": "Add new authentication method",
    "template": "feature"
  }
}
```

### mcp__completeTask

Completes the current task and shows the next task.

**Parameters:**
- None required

**Returns:**
- Information about the completed task and the next task
- If all tasks are completed, indicates issue completion

**Example Request:**
```javascript
{
  "tool": "mcp__completeTask",
  "args": {}
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "taskCompleted": "Research OAuth2 libraries",
    "issueNumber": "0003",
    "nextTask": {
      "id": "task-2",
      "description": "Create authentication flow"
    },
    "context": {
      "problem": "Users need alternative authentication options",
      "approach": "Implement OAuth2 authentication"
    }
  }
}
```

## Context and Documentation Tools

### mcp__addNote

Adds a note to a specific section of an issue.

**Parameters:**
- `note`: The note text to add
- `section`: Section to add the note to
- `issueNumber` (optional): Issue number (uses current if not specified)
- `format` (optional): Note format (blank, question, failure, task)
- `reason` (optional): Reason for a failed approach

**Returns:**
- Confirmation of note addition

**Example Request:**
```javascript
{
  "tool": "mcp__addNote",
  "args": {
    "issueNumber": "0003",
    "section": "Planned approach",
    "note": "Use the OAuth2 library with JWT tokens for state management"
  }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "issueNumber": "0003",
    "section": "Planned approach",
    "noteAdded": true
  }
}
```

### mcp__addQuestion

Adds a question to the "Questions to resolve" section of an issue.

**Parameters:**
- `question`: The question to add
- `issueNumber` (optional): Issue number (uses current if not specified)

**Returns:**
- Confirmation of question addition

**Example Request:**
```javascript
{
  "tool": "mcp__addQuestion",
  "args": {
    "issueNumber": "0003",
    "question": "Should we support refresh tokens"
  }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "issueNumber": "0003",
    "questionAdded": true
  }
}
```

### mcp__logFailure

Logs a failed approach to the "Failed approaches" section.

**Parameters:**
- `approach`: Description of the failed approach
- `issueNumber` (optional): Issue number (uses current if not specified)
- `reason` (optional): Reason for failure

**Returns:**
- Confirmation of the logged approach

**Example Request:**
```javascript
{
  "tool": "mcp__logFailure",
  "args": {
    "issueNumber": "0003",
    "approach": "Using session cookies for OAuth state",
    "reason": "Doesn't work well with mobile clients"
  }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "issueNumber": "0003",
    "approachLogged": true
  }
}
```

## Template Management Tools

### mcp__listTemplates

Lists available templates by type.

**Parameters:**
- `type` (optional): Template type ("issue" or "tag")

**Returns:**
- List of template names by type

**Example Request:**
```javascript
{
  "tool": "mcp__listTemplates",
  "args": { "type": "issue" }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "templates": ["feature", "bugfix", "refactor", "audit"],
    "type": "issue"
  }
}
```

### mcp__showTemplate

Shows the content of a specific template.

**Parameters:**
- `name`: Template name
- `type`: Template type ("issue" or "tag")

**Returns:**
- Template content and metadata

**Example Request:**
```javascript
{
  "tool": "mcp__showTemplate",
  "args": {
    "name": "feature",
    "type": "issue"
  }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "name": "feature",
    "type": "issue",
    "content": "# Issue {{NUMBER}}: {{TITLE}}\n\n## Problem to be solved\n{{PROBLEM}}\n\n..."
  }
}
```

## Using Tools in Sequence

MCP tools can be used in sequence to create workflows. For example, a complete workflow might look like:

1. Get current task context: `mcp__getCurrentTask`
2. Add approach details: `mcp__addNote` (to "Planned approach" section)
3. Add questions: `mcp__addQuestion`
4. Log failed approaches: `mcp__logFailure`
5. Complete the task: `mcp__completeTask`

This enables AI assistants to work through tasks systematically while documenting their reasoning and progress.

## Onboarding and Workflow Tools

These tools help AI assistants quickly understand how to use issue-cards and follow best practices.

### mcp__onboarding

Provides role-specific onboarding information to guide AIs in using issue-cards.

**Parameters:**
- `role` (optional): Role-specific onboarding - "pm", "developer", or "reviewer" (default: "pm")

**Returns:**
- Comprehensive onboarding information including workflows, best practices, and tool mappings

**Example Request:**
```javascript
{
  "tool": "mcp__onboarding",
  "args": { "role": "developer" }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "title": "Developer Onboarding",
    "description": "Welcome to issue-cards developer workflow! Here's how to get started:",
    "workflows": [
      {
        "name": "Task workflow",
        "steps": [
          "1. Get your current task with mcp__getCurrentTask",
          "2. Add questions using mcp__addQuestion if anything is unclear",
          "3. Log failed approaches with mcp__logFailure when you try something that doesn't work",
          "4. Complete task with mcp__completeTask when finished"
        ]
      },
      // Additional workflows...
    ],
    "bestPractices": [
      "Document failed approaches to help others learn",
      "Break down complex tasks into smaller sub-tasks",
      // Additional best practices...
    ],
    "toolMap": [
      { "name": "mcp__getCurrentTask", "description": "View your current task and context" },
      // Additional tools...
    ]
  }
}
```

### mcp__workflow

Provides step-by-step guides for common issue-cards workflows.

**Parameters:**
- `workflow` (optional): Specific workflow to get guidance for

**Returns:**
- Detailed workflow guide with steps, tool usage examples, and tips
- If no workflow is specified, returns a list of available workflows

**Example Request:**
```javascript
{
  "tool": "mcp__workflow",
  "args": { "workflow": "create-feature" }
}
```

**Example Response:**
```javascript
{
  "success": true,
  "data": {
    "title": "Create Feature Issue Workflow",
    "description": "Guide for creating a well-structured feature issue",
    "steps": [
      {
        "step": 1,
        "description": "Check available templates",
        "tool": "mcp__listTemplates",
        "args": { "type": "issue" }
      },
      // Additional steps...
    ],
    "tips": [
      "Feature titles should be clear and action-oriented",
      // Additional tips...
    ]
  }
}
```

### Role-specific Aliases

For convenience, the following aliases provide direct access to role-specific onboarding:

| Tool | Description |
|------|-------------|
| `mcp__pm` | Project Manager onboarding |
| `mcp__dev` | Developer onboarding |
| `mcp__reviewer` | Reviewer onboarding |

These aliases take no parameters and return the same format as `mcp__onboarding` with the corresponding role.