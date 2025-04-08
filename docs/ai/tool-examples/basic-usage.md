// ABOUTME: AI-specific examples of basic MCP tool usage
// ABOUTME: Contains practical examples for common operations

# Basic MCP Tool Usage Examples

## Issue Management Tools

### Listing Issues
```json
// List all open issues
{
  "tool": "mcp__listIssues",
  "args": { "state": "open" }
}

// List all closed issues
{
  "tool": "mcp__listIssues",
  "args": { "state": "closed" }
}

// List all issues regardless of state
{
  "tool": "mcp__listIssues",
  "args": { "state": "all" }
}
```

### Viewing a Specific Issue
```json
// Show details of issue #0001
{
  "tool": "mcp__showIssue",
  "args": { "issueNumber": "0001" }
}
```

### Setting Current Issue
```json
// Set issue #0001 as the current issue
{
  "tool": "mcp__setCurrentIssue",
  "args": { "issueNumber": "0001" }
}
```

### Getting Current Task
```json
// Get the current task from the current issue
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

## Creating and Managing Tasks

### Creating a New Issue
```json
// Create a simple feature issue
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Add password reset functionality",
    "problem": "Users need a way to reset their passwords when forgotten"
  }
}

// Create a feature issue with more details
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Add password reset functionality",
    "problem": "Users need a way to reset their passwords when forgotten",
    "approach": "Implement email-based password reset with time-limited tokens",
    "task": [
      "Design password reset flow",
      "Create password reset token generation",
      "Implement API endpoint for reset requests",
      "Create email template for reset instructions",
      "Implement token verification and password update",
      "Add password reset UI components"
    ]
  }
}

// Create a bugfix issue
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "bugfix",
    "title": "Fix form validation error messages not displaying",
    "problem": "Error messages are not showing when form validation fails",
    "task": [
      "Reproduce the issue consistently",
      "Identify the cause of missing error messages",
      "Fix the validation display logic",
      "Add tests to prevent regression"
    ]
  }
}
```

### Adding Tasks to Issues
```json
// Add a task to a specific issue
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Add unit tests for the authentication service"
  }
}

// Add a task with a tag
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Test password reset flow #e2e-test"
  }
}

// Add a task after the current task
{
  "tool": "mcp__addTask",
  "args": {
    "description": "Add rate limiting to password reset endpoint",
    "after": true
  }
}

// Add a task before the current task
{
  "tool": "mcp__addTask",
  "args": {
    "description": "Create test environment setup",
    "before": true
  }
}

// Add a task at a specific position
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Update API documentation with new endpoint",
    "at": 3
  }
}
```

### Completing Tasks
```json
// Complete the current task
{
  "tool": "mcp__completeTask",
  "args": {}
}
```

## Documentation Tools

### Adding Notes to Sections
```json
// Add a note to the current issue
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "We'll use JWT tokens with a 15-minute expiration time for security"
  }
}

// Add a note to a specific issue
{
  "tool": "mcp__addNote",
  "args": {
    "issueNumber": "0001",
    "section": "Problem to be solved",
    "note": "This affects all mobile users on iOS 15+ devices"
  }
}
```

### Adding Questions
```json
// Add a question to the current issue
{
  "tool": "mcp__addQuestion",
  "args": {
    "question": "Should we support social login providers in addition to email/password?"
  }
}

// Add a question to a specific issue
{
  "tool": "mcp__addQuestion",
  "args": {
    "issueNumber": "0001",
    "question": "What is the expected volume of password reset requests?"
  }
}
```

### Logging Failed Approaches
```json
// Log a failed approach in the current issue
{
  "tool": "mcp__logFailure",
  "args": {
    "approach": "Tried using localStorage for authentication tokens",
    "reason": "Vulnerable to XSS attacks"
  }
}

// Log a failed approach in a specific issue
{
  "tool": "mcp__logFailure",
  "args": {
    "issueNumber": "0001",
    "approach": "Attempted client-side only validation",
    "reason": "Too easy to bypass security measures"
  }
}
```

## Template Tools

### Listing Templates
```json
// List all issue templates
{
  "tool": "mcp__listTemplates",
  "args": { "type": "issue" }
}

// List all tag templates
{
  "tool": "mcp__listTemplates",
  "args": { "type": "tag" }
}

// List all templates of any type
{
  "tool": "mcp__listTemplates",
  "args": {}
}
```

### Viewing Template Contents
```json
// View a specific issue template
{
  "tool": "mcp__showTemplate",
  "args": {
    "name": "feature",
    "type": "issue"
  }
}

// View a specific tag template
{
  "tool": "mcp__showTemplate",
  "args": {
    "name": "unit-test",
    "type": "tag"
  }
}
```