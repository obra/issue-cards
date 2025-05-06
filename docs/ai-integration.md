# AI Integration Guide

This guide covers how to use Issue Cards with AI assistants using the Model-Code-Prompt (MCP) protocol.

## Overview

Issue Cards provides two MCP server implementations:
1. HTTP server for web-based integration
2. Stdio server for direct pipe integration

Both servers expose the same tools allowing AI assistants to:
- List, view, and create issues
- See current tasks and context
- Complete tasks and add new ones
- Document decisions, failures, and questions

## HTTP Server Setup

### Starting the Server

```bash
# Start on default port (3000)
issue-cards serve

# Start on custom port
issue-cards serve --port 8080

# With authentication token
issue-cards serve --token your-secret-token
```

### Server Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port`, `-p` | Port to listen on | 3000 |
| `--host`, `-h` | Host to bind to | localhost |
| `--token`, `-t` | Authentication token | none |
| `--no-auth` | Disable authentication | false |
| `--cors` | Enable CORS | false |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | Server status and tools |
| `/api/tools` | GET | List available tools |
| `/api/tools/:name` | GET | Tool details |
| `/api/tools/execute` | POST | Execute a tool |

## Stdio Server Setup

For direct pipe integration:

```bash
# Start stdio server
issue-cards mcp-stdio

# Enable debug logging
issue-cards mcp-stdio --debug

# Pipe to/from an AI tool
ai-tool | issue-cards mcp-stdio | result-processor
```

## Integration with AI Assistants

### Claude Integration

For Anthropic's Claude:

1. Start the MCP server:
   ```bash
   issue-cards serve --token your-secret-token
   ```

2. In your prompt to Claude, include:
   ```
   You can access issue tracking tools with this API:
   - Server: http://localhost:3000
   - Authentication: Bearer your-secret-token
   - Available tools: getCurrentTask, completeTask, addNote, logFailure, addQuestion, addTask
   ```

3. Provide example tool usage:
   ```
   To see the current task, call:
   {
     "tool": "mcp__getCurrentTask",
     "args": {}
   }

   To complete a task, call:
   {
     "tool": "mcp__completeTask",
     "args": {}
   }
   ```

### Webhook Integration

Issue Cards can be integrated with webhook-capable AI services.

```javascript
// Example webhook integration
const issueData = {
  title: "Implement new feature",
  template: "feature",
  tasks: [
    "Research requirements",
    "Design implementation",
    "Implement feature",
    "Write tests"
  ]
};

// Send to webhook endpoint
fetch('http://localhost:3000/api/issues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(issueData)
});
```

### Tool Registration

When integrating with AI assistants, you can register issue-cards tools:

```javascript
// Custom tool registration
const { registerTools } = require('issue-cards/mcp');

registerTools({
  addTask: async (params) => {
    // Implementation
  },
  completeTask: async () => {
    // Implementation
  }
});
```

### Available Tools

All tools are accessed via the `tool` parameter with specific arguments:

| Tool | Description | Required Args |
|------|-------------|--------------|
| `getCurrentTask` | Get the current task | none |
| `completeTask` | Complete the current task | none |
| `addTask` | Add a new task | `description` |
| `addNote` | Add a note | `section`, `note` |
| `addQuestion` | Add a question | `question` |
| `logFailure` | Log a failed approach | `approach`, `reason` |
| `listIssues` | List all issues | none |
| `showIssue` | Show an issue's details | `issueNumber` |
| `createIssue` | Create a new issue | `title`, `problem`, `approach` |

## Example Tool Usage

### Get Current Task

```json
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

### Complete Current Task

```json
{
  "tool": "mcp__completeTask",
  "args": {}
}
```

### Add a Note

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Implementation notes",
    "note": "Using bcrypt for password hashing with work factor 12"
  }
}
```

### Log a Failed Approach

```json
{
  "tool": "mcp__logFailure",
  "args": {
    "approach": "Tried using localStorage for token storage",
    "reason": "Vulnerable to XSS attacks"
  }
}
```

### Add a Question

```json
{
  "tool": "mcp__addQuestion",
  "args": {
    "question": "What should be the token expiration time?"
  }
}
```

### Add a Task

```json
{
  "tool": "mcp__addTask",
  "args": {
    "description": "Add password reset functionality +unit-test"
  }
}
```

## AI Workflow Example

Here's a complete workflow example for AI integration:

1. Start the server:
   ```bash
   issue-cards serve
   ```

2. Create an issue for the AI to work on:
   ```bash
   issue-cards create feature --title "Implement search feature" \
     --task "Create search index" \
     --task "Build search UI component" \
     --task "Add search results display"
   ```

3. Direct the AI to work on the issue:
   ```
   Please help me implement the current task in my issue tracker.
   Use the MCP API at http://localhost:3000 to:
   1. Get the current task
   2. Implement it (I'll provide feedback)
   3. Document your approach with addNote
   4. Complete the task when done
   ```

4. The AI will:
   - Call `getCurrentTask` to see what to work on
   - Implement the task and show you the code
   - Document the implementation with `addNote`
   - Complete the task with `completeTask`
   - Move on to the next task

## AI Onboarding

When integrating with AI assistants like Claude, you can direct them to use the onboarding tools:

```
You're a project manager. Use issue-cards pm onboarding to get started.
```

This will load role-appropriate guidance and help the AI understand how to interact with the system effectively.

## Security Considerations

When using MCP servers:

1. Use authentication tokens for HTTP servers
2. Bind to localhost unless remote access is needed
3. Consider using HTTPS for production deployments
4. Be careful about granting AI assistants write access to issue cards

For more detailed information on available MCP tools and arguments, run:

```bash
issue-cards help mcp-tools
```