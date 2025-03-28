// ABOUTME: Command to start the MCP server for AI integration
// ABOUTME: Provides options for port, host, and token configuration

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { UninitializedError, SystemError } = require('../utils/errors');
const output = require('../utils/outputManager');
const { startServer } = require('../utils/mcpServer');

/**
 * Action handler for the serve command
 * 
 * @param {Object} options - Command options
 * @param {number} options.port - Port to run the server on
 * @param {string} options.host - Host to bind the server to
 * @param {string} options.token - Authentication token for the server
 */
async function serveAction(options) {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // Ensure port is a number
    const port = parseInt(options.port, 10);
    if (isNaN(port)) {
      throw new SystemError('Invalid port number')
        .withDisplayMessage(`Invalid port number: ${options.port}`);
    }
    
    // Check for token if not provided
    if (!options.token) {
      output.warning('No authentication token provided. Server will accept all requests.');
      output.warning('For production use, provide a token with the --token option.');
    }
    
    // Start the server
    const server = await startServer({ 
      port,
      host: options.host,
      token: options.token
    });
    
    const address = server.address();
    output.success(`MCP server running at http://${address.address}:${address.port}`);
    output.info('Press Ctrl+C to stop the server');
    
    // Handle process termination
    process.on('SIGINT', async () => {
      output.info('Shutting down server...');
      try {
        const { stopServer } = require('../utils/mcpServer');
        await stopServer(server);
        output.success('Server stopped');
        process.exit(0);
      } catch (error) {
        output.error(`Error shutting down server: ${error.message}`);
        process.exit(1);
      }
    });
    
  } catch (error) {
    if (error instanceof UninitializedError) {
      // Just re-throw the error with display message already set
      throw error;
    } else {
      // Wrap generic errors in a SystemError with display message
      throw new SystemError(`Failed to start MCP server: ${error.message}`)
        .withDisplayMessage(`Failed to start MCP server: ${error.message}`);
    }
  }
}

/**
 * Create the serve command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('serve')
    .description('Start MCP server for AI integration')
    .option('-p, --port <number>', 'Port to run the server on', 3000)
    .option('-H, --host <string>', 'Host to bind the server to', 'localhost')
    .option('-t, --token <string>', 'Authentication token for the server')
    .action(serveAction);
}

module.exports = {
  createCommand,
  serveAction, // Exported for testing
};
