# AI Integration Reference

This reference document provides comprehensive information on integrating AI assistants with issue-cards.

## Integration Overview

issue-cards provides a robust Model Communication Protocol (MCP) for AI integration:

- **MCP Server**: Server for AI interaction (HTTP or stdio transports)
- **MCP Tools**: Standardized tool interface for structured operations
- **Webhook Integration**: Direct integration via HTTP calls
- **Authorization**: Optional token-based authentication for HTTP transport

## MCP Server

The MCP server provides the foundation for AI integration and is available in two transport implementations: HTTP and stdio.

### HTTP Transport (REST API)

The HTTP transport provides a RESTful API for integration with AI assistants over HTTP.

#### Starting the HTTP Server

```bash
# Basic server start on default port (3000)
issue-cards serve

# Custom port and host
issue-cards serve --port 4000 --host 0.0.0.0

# With authentication token
issue-cards serve --token your-secret-token
```

#### HTTP Server Configuration

| Parameter | Environment Variable | Default | Description |
|-----------|----------------------|---------|-------------|
| `--port`, `-p` | `ISSUE_CARDS_MCP_PORT` | `3000` | Port to listen on |
| `--host`, `-h` | `ISSUE_CARDS_MCP_HOST` | `localhost` | Host to bind to |
| `--token`, `-t` | `ISSUE_CARDS_MCP_TOKEN` | none | Authentication token |
| `--cors` | `ISSUE_CARDS_MCP_CORS` | `false` | Enable CORS |

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check server health |
| `/api/status` | GET | Get server status and available tools |
| `/api/tools` | GET | List all available MCP tools |
| `/api/tools/execute` | POST | Execute an MCP tool |
| `/api/issues` | GET | List issues |
| `/api/issues/:number` | GET | Get specific issue |
| `/api/issues/:number/current` | GET | Get current task |

### Stdio Transport (JSON-RPC 2.0)

The stdio transport provides direct integration with AI tools through standard input/output streams using JSON-RPC 2.0.

#### Starting the Stdio Server

```bash
# Basic stdio server
issue-cards mcp-stdio

# With debug logging
issue-cards mcp-stdio --debug

# Using the standalone binary
mcp-stdio-server --debug
```

#### Stdio Server Configuration

| Parameter | Description |
|-----------|-------------|
| `--debug` | Enable debug logging to stderr |

#### JSON-RPC Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `server/info` | Get server information and capabilities | none |
| `tools/execute` | Execute an MCP tool | `tool`, `args` |
| `client/ready` | Client notification to signal readiness | none |

#### Message Format

All messages use JSON-RPC 2.0 format:

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/execute",
  "params": {
    "tool": "mcp__listIssues",
    "args": {
      "state": "open"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "data": [
      {"issueNumber": "0001", "title": "Example Issue"}
    ]
  }
}
```

For more details on the stdio transport, see [MCP Server Implementations](mcp-server-implementations.md).

## MCP Tools

MCP tools provide a structured way for AI assistants to interact with issue-cards.

### Core Issue Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `mcp__listIssues` | List all issues | `state` (open/closed/all) |
| `mcp__showIssue` | Show issue details | `issueNumber` |
| `mcp__getCurrentTask` | Get current task with context | None |
| `mcp__createIssue` | Create a new issue | `template`, `title`, etc. |
| `mcp__setCurrentIssue` | Set an issue as current | `issueNumber` |

### Task Management Tools

| Tool | Description | Key Parameters | Alias |
|------|-------------|----------------|-------|
| `mcp__addTask` | Add a task to an issue | `description`, `position` | `mcp__add` |
| `mcp__completeTask` | Complete current task | None | `mcp__complete` |

### Documentation Tools

| Tool | Description | Key Parameters | Alias |
|------|-------------|----------------|-------|
| `mcp__addNote` | Add a note to a section | `section`, `note` | - |
| `mcp__addQuestion` | Add a question to an issue | `question` | `mcp__question` |
| `mcp__logFailure` | Log a failed approach | `approach`, `reason` | `mcp__failure` |

### Template Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `mcp__listTemplates` | List available templates | `type` (issue/tag) |
| `mcp__showTemplate` | Show template content | `name`, `type` |

### Response Format

All MCP tools return responses in a standardized format:

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

## Integration Methods

### HTTP Integration

For direct HTTP integration:

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
console.log(result.data);
```

### Stdio Integration

For direct stdin/stdout integration:

```javascript
const { spawn } = require('child_process');
const readline = require('readline');

// Spawn the MCP stdio server
const mcp = spawn('mcp-stdio-server', ['--debug'], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Create readline interface for reading responses
const rl = readline.createInterface({
  input: mcp.stdout,
  output: null
});

// Process responses
rl.on('line', (line) => {
  try {
    const message = JSON.parse(line);
    
    // Handle server notifications
    if (message.method === 'server/info') {
      console.log('Connected to MCP server:', message.params.name);
      
      // Send a request to get current task
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/execute',
        params: {
          tool: 'mcp__getCurrentTask',
          args: {}
        }
      };
      
      mcp.stdin.write(JSON.stringify(request) + '\n');
    }
    // Handle responses to our requests
    else if (message.id === 1 && message.result) {
      console.log('Current task:', message.result.data);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

// Handle server exit
mcp.on('exit', (code) => {
  console.log(`MCP server exited with code ${code}`);
  rl.close();
});
```

### Node.js Integration

For Node.js applications:

```javascript
const { registerTools } = require('issue-cards/mcp');

// Register tools for use in your application
registerTools({
  addTask: async (params) => {
    // Implementation
  },
  completeTask: async () => {
    // Implementation
  }
});
```

### Webhook Integration

For webhook-capable AI services:

```javascript
// Create an issue via webhook
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
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-token'
  },
  body: JSON.stringify(issueData)
});
```

## AI Integration Examples

### Getting the Current Task

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
// Use the task data
console.log(`Current task: ${result.data.description}`);
console.log(`Context: ${result.data.context.problem}`);
```

### Adding a Task with Tags

```javascript
const response = await fetch('http://localhost:3000/api/tools/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-token'
  },
  body: JSON.stringify({
    tool: 'mcp__addTask',
    args: {
      description: "Implement user authentication",
      tags: "unit-test,e2e-test"
    }
  })
});

const result = await response.json();
console.log(`Task added: ${result.success}`);
```

### Creating an Issue

```javascript
const response = await fetch('http://localhost:3000/api/tools/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-token'
  },
  body: JSON.stringify({
    tool: 'mcp__createIssue',
    args: {
      template: "feature",
      title: "Add search functionality",
      problem: "Users need to search for specific items",
      approach: "Implement ElasticSearch integration",
      tasks: [
        "Research ElasticSearch integration options",
        "Set up ElasticSearch server",
        "Implement search API endpoint",
        "Create search UI component"
      ]
    }
  })
});

const result = await response.json();
console.log(`Issue created: #${result.data.number}`);
```

## Best Practices

### Authentication

Always use authentication tokens in production:

```bash
# Start server with token
issue-cards serve --token your-secure-token

# Access with token
curl -H "Authorization: Bearer your-secure-token" http://localhost:3000/api/status
```

### Error Handling

Always check for errors in responses:

```javascript
const result = await response.json();
if (!result.success) {
  console.error(`Error: ${result.error.type} - ${result.error.message}`);
  // Handle specific error types
  switch (result.error.type) {
    case 'ValidationError':
      // Handle validation error
      break;
    case 'NotFoundError':
      // Handle not found error
      break;
    // etc.
  }
} else {
  // Process successful result
}
```

### AI Assistant Integration

Recommendations for AI assistant integration:

1. **Always start with context** - Get the current task and issue details
2. **Document decisions** - Add notes explaining approach and reasoning
3. **Track failed attempts** - Use log-failure to document what doesn't work
4. **Ask questions when uncertain** - Use add-question for clarification
5. **Complete tasks atomically** - Mark tasks complete when fully implemented

## Common Error Types

| Error Type | Description | Common Causes |
|------------|-------------|--------------|
| `ValidationError` | Invalid parameters | Missing required fields, wrong format |
| `NotFoundError` | Resource not found | Invalid issue number or template |
| `AuthorizationError` | Authentication failed | Invalid or missing token |
| `SectionNotFoundError` | Invalid section | Trying to add note to non-existent section |
| `UserError` | General user error | Various user input problems |
| `SystemError` | Internal system error | File system issues, permissions problems |

## Security Considerations

1. **Token Authentication** - Always use tokens in production
2. **Host Binding** - Bind to localhost unless external access is needed
3. **Rate Limiting** - Consider adding rate limiting for production use
4. **HTTPS** - Use HTTPS in production environments
5. **Validation** - Always validate input from AI systems

## Related Resources

- [MCP Server Implementations](mcp-server-implementations.md)
- [MCP Server Configuration](mcp-server-config.md)
- [MCP Tool Reference](mcp-tool-reference.md)
- [MCP Curl Examples](mcp-curl-examples.md)
- [AI Integration Guide](../guides/ai-integration.md)