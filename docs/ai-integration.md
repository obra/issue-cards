# AI Integration with Issue Cards

This document provides guidance for integrating AI assistants with Issue Cards using the MCP (Model-Code-Prompt) API.

## Overview

Issue Cards provides a comprehensive API for AI assistants to interact with the system. This allows AI tools to:

1. Create and manage issues
2. Complete tasks and track progress
3. Add notes, questions, and failed approaches to issues
4. Work with templates
5. Retrieve context for decision-making

## Getting Started

To use the MCP API, you must start the Issue Cards server:

```bash
issue-cards serve
```

By default, this starts a server on port 3000. You can customize the port and host:

```bash
issue-cards serve -p 4000 -h localhost
```

For security, you can add an API token:

```bash
issue-cards serve -t your-api-token
```

For detailed server configuration options, see the [MCP Server Configuration](mcp-server-config.md) documentation.

## API Endpoints

The MCP API exposes the following key endpoints:

- `GET /api/health` - Check server health
- `GET /api/status` - Get server status and available tools
- `GET /api/tools` - List all available MCP tools
- `POST /api/tools/execute` - Execute an MCP tool

## MCP Tools

Issue Cards provides several MCP tools for AI integration. All tools follow a consistent pattern:

1. Each tool accepts a specific set of parameters
2. Each tool returns a standardized response format
3. All tools include validation and error handling

### Response Format

All MCP tools return responses in the following format:

```json
{
  "success": true,
  "data": {
    // Tool-specific response data
  }
}
```

Or for errors:

```json
{
  "success": false,
  "error": {
    "type": "ErrorType",
    "message": "Human-readable error message"
  }
}
```

### Available Tools

#### Core Issue Management

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `mcp__listIssues` | List all issues | `state` (open/closed/all) |
| `mcp__showIssue` | Show issue details | `issueNumber` |
| `mcp__getCurrentTask` | Get current task with context | None |
| `mcp__addTask` | Add a task to an issue | `issueNumber`, `description` |

#### Task and Issue Creation

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `mcp__createIssue` | Create a new issue from template | `template`, `title`, `problem`, etc. |
| `mcp__completeTask` | Complete current task | None |

#### Context and Documentation

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `mcp__addNote` | Add a note to a section | `section`, `note`, `issueNumber` |
| `mcp__addQuestion` | Add a question to an issue | `question`, `issueNumber` |
| `mcp__logFailure` | Log a failed approach | `approach`, `reason`, `issueNumber` |

#### Template Management

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `mcp__listTemplates` | List available templates | `type` (issue/tag) |
| `mcp__showTemplate` | Show template content | `name`, `type` |

## Using the API with AI Assistants

To integrate with AI assistants, you can use the API to:

1. Retrieve the current task context
2. Document AI-generated solutions
3. Track progress through a workflow
4. Maintain a record of approaches tried

For detailed command-line examples using curl, see the [MCP Curl Examples](mcp-curl-examples.md) documentation.

For example prompts to use with Claude, see the [Claude Prompt Examples](claude-prompt-examples.md) documentation.

For sample integration scripts, see the [examples/integrations](../examples/integrations) directory.

### Example: Getting the Current Task

```javascript
const response = await fetch('http://localhost:3000/api/tools/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-token'
  },
  body: JSON.stringify({
    tool: 'mcp__getCurrentTask',
    args: {}
  })
});

const result = await response.json();
// Access task details and context
const task = result.data;
```

### Example: Recording AI's Solution Approach

```javascript
const response = await fetch('http://localhost:3000/api/tools/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-token'
  },
  body: JSON.stringify({
    tool: 'mcp__addNote',
    args: {
      section: 'Planned approach',
      note: 'Implement solution using the Strategy pattern to improve flexibility'
    }
  })
});

const result = await response.json();
// Check if note was added successfully
console.log(result.success);
```

## Best Practices for AI Integration

1. **Start with Context**: Always begin by getting the current task and its context.
2. **Document Reasoning**: Use `mcp__addNote` to document the AI's reasoning and approach.
3. **Record Failed Approaches**: Use `mcp__logFailure` to document strategies that didn't work.
4. **Ask Questions**: Use `mcp__addQuestion` when clarification is needed.
5. **Complete Tasks**: Use `mcp__completeTask` when work is finished to move to the next step.

## Error Handling

All MCP tools include robust error handling. Common error types:

- `ValidationError`: Invalid arguments provided
- `NotFoundError`: Requested resource (issue, template, etc.) not found
- `SectionNotFoundError`: Referenced section doesn't exist in the issue
- `UserError`: Generic user error condition

Always check the `success` field in responses and handle errors gracefully.

## Security Considerations

1. Use API tokens for all production deployments
2. Run the server on localhost or behind authentication
3. Restrict network access to the server in production environments
4. Consider using HTTPS in production

## Example Workflow

A typical AI integration workflow might look like:

1. Get current task and context
2. Analyze the problem
3. Document the planned approach
4. Record any failed attempts
5. Implement the solution
6. Document the implementation
7. Complete the task

This enables smooth collaboration between humans and AI assistants, with clear tracking of progress and reasoning.