# AI Integration with MCP Tools

This document describes how to integrate AI assistants with Issue Cards via MCP (Model Control Protocol) tools.

## Overview

Issue Cards provides a set of MCP tools that allow AI assistants to interact with issues programmatically. These tools are exposed via a REST API that can be accessed by AI assistants.

## Starting the MCP Server

To start the MCP server, run the following command:

```bash
issue-cards serve [options]
```

Options:
- `-p, --port <number>` - Port to use (default: 3000)
- `-h, --host <string>` - Host to bind to (default: localhost)
- `-t, --token <string>` - Authentication token for API access

Example:
```bash
issue-cards serve --port 3000 --token my-secret-token
```

## API Reference

### Authentication

All API requests (except health check) require authentication. You can provide the token in one of two ways:

1. As a Bearer token in the Authorization header:
   ```
   Authorization: Bearer my-secret-token
   ```

2. As a query parameter:
   ```
   ?token=my-secret-token
   ```

### Endpoints

- `GET /api/health` - Health check endpoint (no authentication required)
- `GET /api/status` - Server status and available tools
- `GET /api/tools` - List available MCP tools
- `GET /api/tools/:name` - Get details for a specific tool
- `POST /api/tools/execute` - Execute a tool

### Executing Tools

To execute a tool, send a POST request to `/api/tools/execute` with a JSON body containing:

```json
{
  "tool": "mcp__toolName",
  "args": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

### Available Tools

#### mcp__listIssues

Lists all available issues.

Parameters:
- `state` (optional): Filter by issue state (`open`, `closed`, `all`). Default: `all`

Example:
```json
{
  "tool": "mcp__listIssues",
  "args": {
    "state": "open"
  }
}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "number": "0001",
      "title": "Example Issue",
      "state": "open",
      "path": "/path/to/issue-0001.md"
    }
  ]
}
```

#### mcp__showIssue

Shows details of a specific issue.

Parameters:
- `issueNumber` (required): The issue number to show

Example:
```json
{
  "tool": "mcp__showIssue",
  "args": {
    "issueNumber": "0001"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "number": "0001",
    "title": "Example Issue",
    "state": "open",
    "path": "/path/to/issue-0001.md",
    "content": "# Issue 0001: Example Issue\n\n...",
    "tasks": [
      {
        "id": "task-1",
        "description": "Example task",
        "completed": false
      }
    ]
  }
}
```

#### mcp__getCurrentTask

Gets the current task and context.

Parameters: None

Example:
```json
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "issueTitle": "Example Issue",
    "taskId": "task-1",
    "description": "Example task",
    "context": {
      "problem": "Problem description",
      "approach": "Planned approach"
    }
  }
}
```

#### mcp__addTask

Adds a new task to an issue.

Parameters:
- `issueNumber` (required): The issue number to add the task to
- `description` (required): The task description

Example:
```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "New task from API"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "task-123",
    "description": "New task from API",
    "completed": false
  }
}
```

## Error Handling

All tools return a standardized error response when an error occurs:

```json
{
  "success": false,
  "error": {
    "type": "ErrorType",
    "message": "Error message"
  }
}
```

Common error types:
- `ValidationError` - Invalid parameters
- `NotFoundError` - Resource not found
- `ExecutionError` - Error during tool execution