# MCP Server Implementations

Issue Cards provides two separate MCP server implementations:

1. **HTTP Server**: The default implementation, accessible via the `serve` command. This provides a RESTful API interface with optional authentication.

2. **Stdio Server**: A JSON-RPC 2.0 implementation that communicates over standard input/output streams, following the MCP stdio transport specification.

## HTTP Server (REST API)

The HTTP server exposes MCP tools via RESTful endpoints and is designed for web integration. Start it with:

```bash
issue-cards serve [options]
```

This server provides the following endpoints:

- `GET /api/health`: Health check endpoint
- `GET /api/status`: Server status and available tools
- `GET /api/tools`: List available MCP tools
- `GET /api/tools/:name`: Get details for a specific tool
- `POST /api/tools/execute`: Execute a tool

For more details, see `issue-cards serve --help`.

## Stdio Server (JSON-RPC 2.0)

The stdio server communicates over standard input/output streams using the JSON-RPC 2.0 protocol. This implementation is designed for direct integration with AI assistants and other tools that implement the MCP protocol with stdio transport.

Start it with:

```bash
issue-cards mcp-stdio [options]
```

Or use the dedicated binary:

```bash
issue-cards-mcp-server [options]
```

### Stdio Server Protocol

The stdio implementation follows the MCP specification for stdio transport:

1. Each message is a single line of JSON-RPC 2.0 formatted content
2. Server logs and debugging information are written to stderr
3. The protocol supports:
   - Requests (with id and method)
   - Responses (with id and result/error)
   - Notifications (with method but no id)

### Message Format

All messages follow the JSON-RPC 2.0 specification:

**Requests:**
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

**Responses:**
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

**Error Responses:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": {
      "method": "unknown/method"
    }
  }
}
```

**Notifications:**
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

### Supported Methods

The stdio server supports the following JSON-RPC methods:

- `server/info`: Get server information and capabilities
- `tools/execute`: Execute an MCP tool
- `client/ready`: Client notification to signal readiness

### Integration Examples

#### Node.js Integration

Here's an example of integrating with the stdio server from a Node.js application:

```javascript
const { spawn } = require('child_process');
const readline = require('readline');

// Spawn the MCP stdio server
const mcp = spawn('mcp-stdio-server', ['--debug'], {
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

// Execute a tool
const executeRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/execute",
  params: {
    tool: "mcp__listIssues",
    args: {
      state: "open"
    }
  }
};

mcp.stdin.write(JSON.stringify(executeRequest) + '\n');
```

#### Python Integration

Here's an example of integrating with the stdio server from a Python application:

```python
import json
import subprocess
import threading

# Start the MCP stdio server
process = subprocess.Popen(
    ['mcp-stdio-server', '--debug'],
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
                # Send a request to list issues
                request = {
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
                process.stdin.write(json.dumps(request) + '\n')
                process.stdin.flush()
        except json.JSONDecodeError:
            print(f"Invalid JSON: {line}")

# Start reading thread
stdout_thread = threading.Thread(target=handle_stdout)
stdout_thread.daemon = True
stdout_thread.start()

# Function to send a request to the server
def send_request(method, params=None, request_id=1):
    request = {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method
    }
    
    if params is not None:
        request["params"] = params
        
    process.stdin.write(json.dumps(request) + '\n')
    process.stdin.flush()
    return request_id

# Send a server/info request manually
send_request("server/info")

# Wait for user to press Ctrl+C
try:
    stdout_thread.join()
except KeyboardInterrupt:
    print("Shutting down...")
    process.terminate()
    process.wait()
```

For more details, see `issue-cards mcp-stdio --help`.