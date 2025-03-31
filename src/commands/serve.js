// ABOUTME: Serve command for launching the MCP server for AI integration
// ABOUTME: Provides a REST API for interacting with issue-cards via MCP tools

const { Command } = require('commander');
const { startServer } = require('../mcp/mcpServer');
const outputManager = require('../utils/outputManager');
const { isInitialized } = require('../utils/directory');
const { UserError, UninitializedError } = require('../utils/errors');

/**
 * Execute the serve command action
 * 
 * @param {Object} options - Command options
 * @param {number} options.port - Port number to use
 * @param {string} options.host - Hostname to bind to
 * @param {string} options.token - Authentication token for API access
 * @returns {Promise<Object>} The server instance
 */
async function serveAction(options) {
  // Validate issue tracking is initialized
  if (!(await isInitialized())) {
    throw new UninitializedError()
      .withDisplayMessage('Issue tracking is not initialized. Run "issue-cards init" first.');
  }
  
  // Validate port is a number
  const port = parseInt(options.port, 10);
  if (isNaN(port)) {
    throw new UserError('Invalid port number')
      .withDisplayMessage('Invalid port number. Port must be a valid number.');
  }
  
  // Start the server
  const server = startServer({
    port: port,
    host: options.host,
    token: options.token
  });
  
  // Output server info
  outputManager.success(`MCP server started successfully`);
  outputManager.info(`Server URL: http://${options.host}:${port}`);
  
  // Output authentication info if a token was provided
  if (options.token) {
    outputManager.info('Authentication enabled - API requests require token');
  } else {
    outputManager.warn('Authentication disabled - API is open to all requests');
  }
  
  // Output API endpoints
  outputManager.info('API Endpoints:');
  outputManager.list([
    'GET  /api/health - Health check endpoint',
    'GET  /api/status - Server status and available tools',
    'GET  /api/tools - List available MCP tools',
    'GET  /api/tools/:name - Get details for a specific tool',
    'POST /api/tools/execute - Execute a tool'
  ]);
  
  // Keep the process running
  process.on('SIGINT', async () => {
    outputManager.info('Shutting down MCP server...');
    await require('../mcp/mcpServer').stopServer(server);
    process.exit(0);
  });
  
  return server;
}

/**
 * Create the serve command
 * 
 * @returns {Command} The serve command
 */
function createCommand() {
  const command = new Command('serve');
  
  command
    .description('Start the MCP server for AI integration')
    .option('-p, --port <port>', 'Port to use', 3000)
    .option('-h, --host <hostname>', 'Host to bind to', 'localhost')
    .option('-t, --token <authToken>', 'Authentication token for API access')
    .action(async (options) => {
      try {
        await serveAction(options);
      } catch (error) {
        outputManager.error(`Failed to start MCP server: ${error.message}`);
        process.exit(1);
      }
    });
  
  return command;
}

module.exports = { createCommand, serveAction };