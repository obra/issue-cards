# AI Integration Guide

This guide explains how to integrate issue-cards with AI tools and services.

## Overview

issue-cards supports integration with AI services through webhook endpoints and the MCP (Model Communication Protocol) server.

## Using the MCP Server

The MCP server provides a standardized interface for AI models to interact with issue-cards.

### Starting the Server

```bash
issue-cards serve
```

This will start the MCP server on the default port (3000).

### Configuration

See [MCP Server Configuration](../reference/mcp-server-config.md) for details on configuring the server.

## Webhook Integration

issue-cards can be integrated with webhook-capable AI services.

### Example: Integration with Claude

```javascript
// See examples/integrations/claude-webhook.js for a complete example
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

## Tool Registration

When integrating with AI assistants, you can register issue-cards tools:

```javascript
// See examples/integrations/task-workflow.js
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

## Related Topics

- [MCP Server Configuration](../reference/mcp-server-config.md)
- [MCP Tool Reference](../reference/mcp-tool-reference.md)
- [Examples](https://github.com/your-username/issue-cards/tree/main/examples/integrations)