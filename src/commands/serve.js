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
    .option('--no-auth', 'Disable authentication (not recommended for production)')
    .action(async (options) => {
      try {
        await serveAction(options);
      } catch (error) {
        outputManager.error(`Failed to start MCP server: ${error.message}`);
        process.exit(1);
      }
    });
    
  // Add rich help text
  command.addHelpText('after', `
Description:
  Starts the Model-Code-Prompt (MCP) server for AI integration with Issue Cards.
  The MCP server provides a REST API that allows AI assistants like Claude or
  GPT to interact with issues and tasks. The server runs until interrupted.

  NOTE: This command uses HTTP transport for the MCP server. For stdin/stdout integration,
  see the 'mcp-stdio' command which implements the stdio transport mechanism.

Examples:
  # Start the server with default settings (localhost:3000)
  $ issue-cards serve
  
  # Start the server on a custom port
  $ issue-cards serve --port 8080
  
  # Start the server and bind to all interfaces
  $ issue-cards serve --host 0.0.0.0
  
  # Start the server with authentication
  $ issue-cards serve --token your-secret-token
  
  # Run with environment variables
  $ ISSUE_CARDS_MCP_PORT=8080 ISSUE_CARDS_MCP_TOKEN=secret issue-cards serve

API Endpoints:
  GET  /api/health       - Health check endpoint
  GET  /api/status       - Server status and available tools
  GET  /api/tools        - List available MCP tools
  GET  /api/tools/:name  - Get details for a specific tool
  POST /api/tools/execute - Execute an MCP tool

Authentication:
  Authentication is recommended for production use. When authentication is enabled,
  all API requests must include an 'Authorization' header with the token:
  
  Authorization: Bearer your-secret-token
  
  For development and testing, you can disable authentication with --no-auth.

MCP Tools:
  The MCP server exposes various tools that AI assistants can use:
  - list        - List open issues
  - show        - Show issue details
  - current     - Show current task
  - create      - Create a new issue
  - addTask     - Add a task to an issue
  - completeTask - Mark current task as complete
  - addQuestion - Add a question to an issue
  - logFailure  - Log a failed approach
  - addNote     - Add a note to an issue section

Environment Variables:
  ISSUE_CARDS_MCP_PORT  - Port for the MCP server
  ISSUE_CARDS_MCP_HOST  - Host to bind the server to
  ISSUE_CARDS_MCP_TOKEN - Authentication token
  ISSUE_CARDS_MCP_CORS  - Enable CORS for cross-origin requests

Alternative Transport:
  For direct integration with AI tools using stdin/stdout, use:
  $ issue-cards mcp-stdio

For more information:
  $ issue-cards help ai-integration  # Learn more about AI integration
  `);
  
  return command;
}

module.exports = { createCommand, serveAction };