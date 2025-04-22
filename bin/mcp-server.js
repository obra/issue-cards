#!/usr/bin/env node

// ABOUTME: MCP server entry point for Claude Code integration
// ABOUTME: Automatically handles port allocation and reports back to the client

const express = require('express');
const http = require('http');
const { Command } = require('commander');
const { createServer, registerTools } = require('../src/mcp/mcpServer');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const program = new Command();
program
  .option('-p, --port <port>', 'Port to listen on (defaults to finding an available port)', parseInt)
  .option('-h, --host <host>', 'Host to bind to', 'localhost')
  .option('-t, --token <token>', 'Authentication token')
  .option('--mcp-output <file>', 'Output file for the MCP configuration')
  .parse(process.argv);

const options = program.opts();

// Create the Express app
const app = createServer({
  token: options.token,
  enableCors: true
});

// Get all registered tools
const tools = registerTools(app);

// Create the server
const server = http.createServer(app);

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error.message);
  process.exit(1);
});

// Start the server on either the specified port or an available port
function startServer() {
  const host = options.host || 'localhost';
  const port = options.port || 0; // Port 0 means "find an available port"
  
  server.listen(port, host, () => {
    const address = server.address();
    const actualPort = address.port;
    
    // Format information in MCP configuration format
    const mcpConfig = {
      url: `http://${host}:${actualPort}`,
      port: actualPort,
      transport: "sse",
      tools: tools.map(tool => tool.name),
      toolsCount: tools.length
    };
    
    // Output to the specified file if provided
    if (options.mcpOutput) {
      fs.writeFileSync(options.mcpOutput, JSON.stringify(mcpConfig, null, 2));
    }
    
    // Output to stdout in the format Claude Code expects
    console.log(JSON.stringify(mcpConfig));
    
    // Don't log other messages as they interfere with the JSON parsing
    console.error(`MCP server running at http://${host}:${actualPort}`);
    console.error(`Registered ${tools.length} tools`);
  });
}

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down MCP server...');
  server.close(() => {
    process.exit(0);
  });
});