# AI Integration Guide

This guide explains how to integrate issue-cards with AI tools and services.

## Overview

issue-cards supports integration with AI services through webhook endpoints and the MCP (Model Communication Protocol) server. We provide specialized documentation for AI consumption in the [AI documentation directory](../ai/index.md).

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

## AI Documentation

We provide dedicated documentation specifically formatted for AI consumption:

- [Role-specific Guidance](../ai/index.md#roles) - Documentation for project managers, developers, and reviewers
- [Workflow Guides](../ai/index.md#workflows) - Step-by-step guides for common processes
- [Best Practices](../ai/index.md#best-practices) - Guidance for effective issue and task management
- [Tool Examples](../ai/index.md#tool-examples) - Example patterns for using MCP tools

When integrating with AI assistants like Claude, you can direct them to use the onboarding tools:

```
You're a project manager. Use issue-cards pm onboarding to get started.
```

This will load role-appropriate guidance and help the AI understand how to interact with the system effectively.

## Related Topics

- [MCP Server Configuration](../reference/mcp-server-config.md)
- [MCP Tool Reference](../reference/mcp-tool-reference.md)
- [Examples](https://github.com/your-username/issue-cards/tree/main/examples/integrations)