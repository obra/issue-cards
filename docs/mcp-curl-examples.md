# MCP API Curl Examples

This document provides examples of how to use the Issue Cards MCP API with curl. These examples are useful for testing the API, automating tasks, or integrating with scripts.

## Setup

Before running these examples, start the MCP server:

```bash
issue-cards serve
```

For a production environment, you should use authentication:

```bash
issue-cards serve --token your-api-token
```

In all examples below, replace `http://localhost:3000` with your server URL if different, and add the appropriate authentication token to your requests.

## Basic API Endpoints

### Check Server Health

```bash
curl -s http://localhost:3000/api/health | jq
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-03-29T15:32:47.123Z"
}
```

### Get Available Tools

```bash
curl -s http://localhost:3000/api/tools | jq
```

Response:
```json
{
  "count": 11,
  "tools": [
    {
      "name": "mcp__listIssues",
      "description": "List all issues",
      "parameters": []
    },
    {
      "name": "mcp__showIssue",
      "description": "Show details of a specific issue",
      "parameters": []
    },
    ...
  ]
}
```

### Get Details for a Specific Tool

```bash
curl -s http://localhost:3000/api/tools/mcp__listIssues | jq
```

Response:
```json
{
  "name": "mcp__listIssues",
  "description": "List all issues",
  "parameters": [
    {
      "name": "state",
      "type": "string",
      "description": "Filter by issue state (open, closed, all)",
      "required": false
    }
  ]
}
```

## Tool Execution Examples

### List all Issues

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__listIssues", "args": {"state": "open"}}' | jq
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "number": "0001",
      "title": "Fix login redirect",
      "state": "open",
      "content": "# Issue 0001: Fix login redirect\n..."
    },
    {
      "number": "0002",
      "title": "Add search functionality",
      "state": "open",
      "content": "# Issue 0002: Add search functionality\n..."
    }
  ]
}
```

### Show a Specific Issue

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__showIssue", "args": {"issueNumber": "0001"}}' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "number": "0001",
    "title": "Fix login redirect",
    "state": "open",
    "content": "# Issue 0001: Fix login redirect\n\n## Problem to be solved\nRedirect fails on mobile\n\n..."
  }
}
```

### Get Current Task

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__getCurrentTask", "args": {}}' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "issueTitle": "Fix login redirect",
    "taskId": "task-1",
    "description": "Write failing unit tests for the functionality",
    "context": {
      "problem": "Redirect fails on mobile",
      "approach": "Fix the URL handling in the redirection code",
      "instructions": "Ensure all tests pass on both desktop and mobile"
    }
  }
}
```

### Add a Task to an Issue

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__addTask", "args": {"issueNumber": "0001", "description": "Test on multiple mobile browsers"}}' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "task-5",
    "description": "Test on multiple mobile browsers",
    "completed": false,
    "issueNumber": "0001"
  }
}
```

### Create a New Issue

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "mcp__createIssue", 
    "args": {
      "template": "feature",
      "title": "Add new authentication method",
      "problem": "Users need alternative authentication options",
      "approach": "Implement OAuth2 authentication",
      "task": ["Research OAuth2 libraries", "Create authentication flow"]
    }
  }' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "number": "0003",
    "title": "Add new authentication method",
    "template": "feature"
  }
}
```

### Complete the Current Task

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__completeTask", "args": {}}' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "taskCompleted": "Write failing unit tests for the functionality",
    "issueNumber": "0001",
    "nextTask": {
      "id": "task-2",
      "description": "Run the unit tests and verify they fail for the expected reason"
    },
    "context": {
      "problem": "Redirect fails on mobile",
      "approach": "Fix the URL handling in the redirection code"
    }
  }
}
```

### Add a Note to an Issue

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "mcp__addNote", 
    "args": {
      "issueNumber": "0001",
      "section": "Planned approach",
      "note": "Use URL encoding to handle special characters in redirect URLs"
    }
  }' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "section": "Planned approach",
    "noteAdded": true
  }
}
```

### Add a Question to an Issue

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "mcp__addQuestion", 
    "args": {
      "issueNumber": "0001",
      "question": "Should we support deep linking to protected pages"
    }
  }' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "questionAdded": true
  }
}
```

### Log a Failed Approach

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "mcp__logFailure", 
    "args": {
      "issueNumber": "0001",
      "approach": "Using URL parameters for redirect paths",
      "reason": "Doesn't work with complex URLs that contain query parameters"
    }
  }' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "approachLogged": true
  }
}
```

### List Templates

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__listTemplates", "args": {"type": "issue"}}' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "templates": ["feature", "bugfix", "refactor", "audit"],
    "type": "issue"
  }
}
```

### Show Template Content

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "mcp__showTemplate", 
    "args": {
      "name": "feature",
      "type": "issue"
    }
  }' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "name": "feature",
    "type": "issue",
    "content": "# Issue {{NUMBER}}: {{TITLE}}\n\n## Problem to be solved\n{{PROBLEM}}\n\n..."
  }
}
```

## Using Command Aliases

The API supports aliases for commonly used commands, allowing for shorter tool names with the same functionality.

### Using the mcp__add alias (for mcp__addTask)

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__add", "args": {"issueNumber": "0001", "description": "Test on iPhone and Android"}}' | jq
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "task-6",
    "description": "Test on iPhone and Android",
    "completed": false,
    "issueNumber": "0001"
  }
}
```

### Using the mcp__complete alias (for mcp__completeTask)

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__complete", "args": {}}' | jq
```

### Using the mcp__question alias (for mcp__addQuestion)

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__question", "args": {"question": "Should we support desktop notifications"}}' | jq
```

### Using the mcp__failure alias (for mcp__logFailure)

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__failure", "args": {"approach": "Using cookies for token storage", "reason": "Security issues"}}' | jq
```

## Using Authentication

When authentication is enabled, you need to include the token in your requests:

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-token" \
  -d '{"tool": "mcp__listIssues", "args": {}}' | jq
```

Alternatively, you can include the token as a query parameter:

```bash
curl -s -X POST "http://localhost:3000/api/tools/execute?token=your-api-token" \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__listIssues", "args": {}}' | jq
```

## Error Handling Examples

### Invalid Tool Name

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__nonExistentTool", "args": {}}' | jq
```

Response:
```json
{
  "success": false,
  "error": {
    "type": "NotFoundError",
    "message": "Tool #mcp__nonExistentTool not found"
  }
}
```

### Missing Required Parameter

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__showIssue", "args": {}}' | jq
```

Response:
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "should have required property 'issueNumber'",
    "errors": ["should have required property 'issueNumber'"]
  }
}
```

### Resource Not Found

```bash
curl -s -X POST http://localhost:3000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "mcp__showIssue", "args": {"issueNumber": "9999"}}' | jq
```

Response:
```json
{
  "success": false,
  "error": {
    "type": "NotFoundError",
    "message": "Issue #9999 not found"
  }
}
```