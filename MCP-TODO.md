# MCP Stdio Server Implementation Plan

This document outlines the plan for implementing a proper stdio MCP server for issue-cards, following the [Model Context Protocol specification](https://modelcontextprotocol.io/llms-full.txt).

## Background

The current MCP server in issue-cards is implemented as an HTTP server using Express.js, which works well for web-based integrations. However, for proper integration with tools that use the stdio transport mechanism defined in the MCP specification, we need to implement a compliant stdio server that uses JSON-RPC 2.0 over stdin/stdout.

## Implementation Plan

### 1. Create a New Stdio Transport Implementation

Create a `StdioTransport` class that implements the MCP stdio transport protocol:
- Communicate over stdin/stdout using JSON-RPC 2.0
- Handle requests, responses, and notifications
- Support tool discovery and execution
- Log to stderr (never stdout)

```javascript
// src/mcp/stdioTransport.js
```

### 2. Create a Stdio Server Entrypoint

Create a server module that initializes the transport and manages lifecycle:

```javascript
// src/mcp/stdioServer.js
```

### 3. Create a CLI Command for the Stdio Server

Add a new CLI command to start the stdio server:

```javascript
// src/commands/mcpStdio.js
```

### 4. Register the New Command

Update the CLI to include the new command:

```javascript
// src/cli.js
```

### 5. Add a Bin Script for Direct Execution

Create a standalone binary for direct invocation:

```javascript
// bin/mcp-stdio-server.js
```

### 6. Update Package.json

Add the new binary to the package.json:

```json
{
  "bin": {
    "issue-cards": "./bin/issue-cards.js",
    "mcp-stdio-server": "./bin/mcp-stdio-server.js"
  }
}
```

### 7. Add Tests

Create comprehensive tests for the stdio transport:

```javascript
// tests/mcp/stdioTransport.test.js
```

### 8. Update Documentation

Add documentation about the stdio server implementation:

```markdown
// docs/reference/mcp-server-implementations.md
```

## Implementation Timeline

1. **Phase 1**: Create tests for the stdio transport implementation
   - Write unit tests for StdioTransport class
   - Write tests for JSON-RPC 2.0 message handling

2. **Phase 2**: Implement core stdio transport
   - Implement StdioTransport class based on tests
   - Add JSON-RPC 2.0 message handling

3. **Phase 3**: Integrate with existing MCP tools
   - Connect to registration system
   - Handle tool execution requests

4. **Phase 4**: Create CLI commands and entry points
   - Add mcp-stdio command
   - Create dedicated binary

5. **Phase 5**: Documentation
   - Update existing docs
   - Add examples