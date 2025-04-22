#!/usr/bin/env node

// ABOUTME: MCP stdio server binary for direct invocation
// ABOUTME: Provides stdio transport for MCP integration

const { startStdioServer } = require('../src/mcp/stdioServer');
const { isInitialized } = require('../src/utils/directory');

// Parse options
const args = process.argv.slice(2);
const debug = args.includes('--debug');

// Function to start the server
async function main() {
  try {
    // Check if issue tracking is initialized
    if (!(await isInitialized())) {
      process.stderr.write('Error: Issue tracking is not initialized.\n');
      process.stderr.write('Run "issue-cards init" first.\n');
      process.exit(1);
    }

    // Configure MCP
    const mcpConfig = {
      debug
    };

    // Output basic information to stderr
    if (debug) {
      process.stderr.write('Starting MCP stdio server\n');
      process.stderr.write(`Debug mode: ${debug ? 'enabled' : 'disabled'}\n`);
    }

    // Start the server
    await startStdioServer(mcpConfig);
    
    // The server will keep running until terminated
  } catch (error) {
    process.stderr.write(`Fatal error: ${error.message}\n`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught exception: ${error.message}\n`);
  process.stderr.write(error.stack + '\n');
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`Unhandled rejection: ${reason}\n`);
  if (reason.stack) {
    process.stderr.write(reason.stack + '\n');
  }
  process.exit(1);
});

// Start the server
main();