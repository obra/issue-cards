// ABOUTME: Serve command for launching the MCP server for AI integration
// ABOUTME: Provides a REST API for interacting with issue-cards via MCP tools

const { Command } = require('commander');
const { startServer } = require('../mcp/mcpServer');
const outputManager = require('../utils/outputManager');

/**
 * Create the serve command
 * 
 * @returns {Command} The serve command
 */
function createCommand() {
  const command = new Command('serve');
  
  command
    .description('Start the MCP server for AI integration')
    .option('-p, --port <number>', 'Port to use', 3000)
    .option('-h, --host <string>', 'Host to bind to', 'localhost')
    .option('-t, --token <string>', 'Authentication token for API access')
    .action(async (options) => {
      try {
        // Start the server
        const server = startServer({
          port: options.port,
          host: options.host,
          token: options.token
        });
        
        // Output server info
        outputManager.success(`MCP server started successfully`);
        outputManager.info(`Server URL: http://${options.host}:${options.port}`);
        
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
      } catch (error) {
        outputManager.error(`Failed to start MCP server: ${error.message}`);
        process.exit(1);
      }
    });
  
  return command;
}

module.exports = { createCommand };