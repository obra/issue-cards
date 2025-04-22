# MCP Stdio Server

The `mcp-stdio` command provides an MCP server implementation that uses standard input/output streams (stdio) to communicate with AI tools using JSON-RPC 2.0.

## Overview

The stdio MCP server implements the Model Context Protocol (MCP) with the following features:

- JSON-RPC 2.0 communication over stdin/stdout
- Full access to all MCP tools
- Compliant with the MCP stdio transport specification
- Debug mode for troubleshooting

## Usage

```bash
# Start the stdio MCP server
issue-cards mcp-stdio

# Start with debug logging enabled
issue-cards mcp-stdio --debug

# Standalone binary usage
issue-cards-mcp-server --debug
```

## JSON-RPC Protocol

The stdin/stdout transport uses JSON-RPC 2.0 messages, with one message per line:

### Request Format

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

### Response Format

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

### Notification Format

```json
{
  "jsonrpc": "2.0",
  "method": "server/info",
  "params": {
    "name": "issue-cards-mcp",
    "version": "1.0.0",
    "capabilities": {
      "tools": [
        {
          "name": "mcp__listIssues",
          "description": "List all issues",
          "parameters": [
            {
              "name": "state",
              "description": "Filter by issue state",
              "type": "string",
              "required": false
            }
          ]
        }
      ]
    }
  }
}
```

## Supported Methods

The stdio server supports these JSON-RPC methods:

| Method | Description | Parameters |
|--------|-------------|------------|
| `server/info` | Get server information | None |
| `tools/execute` | Execute an MCP tool | `tool`, `args` |
| `client/ready` | Client notification | None |

## Integration Examples

### Node.js

```javascript
const { spawn } = require('child_process');
const readline = require('readline');

// Spawn the MCP stdio server
const mcp = spawn('issue-cards-mcp-server', ['--debug'], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Create readline interface
const rl = readline.createInterface({
  input: mcp.stdout,
  output: null
});

// Handle incoming messages
rl.on('line', (line) => {
  const message = JSON.parse(line);
  console.log('Received:', message);
});

// Send a server/info request
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "server/info"
};

mcp.stdin.write(JSON.stringify(request) + '\n');
```

### Python

```python
import json
import subprocess
import threading

# Start the MCP stdio server
process = subprocess.Popen(
    ['issue-cards-mcp-server', '--debug'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1  # Line buffered
)

# Function to handle stdout messages
def handle_stdout():
    for line in process.stdout:
        try:
            message = json.loads(line)
            print(f"Received: {message}")
            
            # If this is the server info notification, send a request
            if message.get('method') == 'server/info':
                # Send a request to get current task
                request = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "tools/execute",
                    "params": {
                        "tool": "mcp__getCurrentTask",
                        "args": {}
                    }
                }
                process.stdin.write(json.dumps(request) + '\n')
                process.stdin.flush()
        except json.JSONDecodeError:
            print(f"Invalid JSON: {line}")

# Start reading thread
stdout_thread = threading.Thread(target=handle_stdout)
stdout_thread.daemon = True
stdout_thread.start()

# Wait for user to press Ctrl+C
try:
    stdout_thread.join()
except KeyboardInterrupt:
    print("Shutting down...")
    process.terminate()
    process.wait()
```

## When to Use Stdio vs HTTP

Choose the appropriate MCP server implementation based on your needs:

- **Use Stdio when**:
  - Integrating directly with AI assistants through stdin/stdout
  - Working with tools that expect JSON-RPC 2.0 over stdio
  - Creating local scripts or plugins that interact with issue-cards

- **Use HTTP when**:
  - Building web services or browser integrations
  - Working with RESTful APIs
  - Needing authentication and CORS support
  - Serving multiple clients simultaneously

## See Also

- [MCP Server Implementations](mcp-server-implementations.md)
- [MCP Tool Reference](mcp-tool-reference.md)
- [AI Integration Guide](../guides/ai-integration.md)