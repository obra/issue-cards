// ABOUTME: MCP stdio server command for AI integrations
// ABOUTME: Starts an MCP server using stdin/stdout transport

const { Command } = require('commander');
const { startStdioServer } = require('../mcp/stdioServer');

/**
 * Execute the mcp-stdio command action
 * 
 * @param {Object} options - Command options
 * @param {boolean} [options.debug] - Enable debug logging
 * @param {boolean} [options.log] - Enable JSONL logging to temp file
 * @param {string} [options.logPath] - Custom path for log file
 * @returns {Promise<void>}
 */
async function mcpStdioAction(options) {
  // Don't output anything to stdout - it would break the protocol
  // All logging should go to stderr
  
  // Start the stdio server
  const transport = await startStdioServer({
    debug: options.debug || false,
    logging: options.log !== false,
    logPath: options.logPath
  });
  
  // When logging is enabled, we cannot write to stderr as that would interfere with MCP protocol
  // Instead we'll rely on the log file itself to contain the path information in its header
  // No output is generated to stderr
  
  // Process will keep running until killed
}

/**
 * Create the mcp-stdio command
 * 
 * @returns {Command} The command
 */
function createCommand() {
  const command = new Command('mcp-stdio');
  
  command
    .description('Start an MCP server using stdin/stdout transport')
    .option('--debug', 'Enable debug logging to stderr')
    .option('--log', 'Enable JSONL logging to a temp file (default: true)')
    .option('--log-path <path>', 'Specify custom path for the log file')
    .action(async (options) => {
      try {
        await mcpStdioAction(options);
      } catch (error) {
        // Log to stderr only
        process.stderr.write(`Error: ${error.message}\n`);
        process.exit(1);
      }
    });
    
  // Add rich help text
  command.addHelpText('after', `
Description:
  Starts a Model-Code-Prompt (MCP) server that communicates over stdin/stdout.
  This command is designed to be run by AI assistants or other tools that
  integrate with the MCP protocol using stdio transport.

  The server uses JSON-RPC 2.0 as the wire format, with each message on a
  separate line.

Examples:
  # Start the stdio MCP server
  $ issue-cards mcp-stdio
  
  # Start with debug logging
  $ issue-cards mcp-stdio --debug
  
  # Start with JSONL logging to a specific file
  $ issue-cards mcp-stdio --log-path /path/to/mcp-logs.jsonl

Usage Notes:
  - This command does not output anything to stdout, as that would interfere
    with the protocol. All logging is directed to stderr.
  - The server continues running until it receives a signal to terminate
    (SIGINT or SIGTERM), or the input stream is closed.
  - This is a low-level command intended for integration with AI tools that
    implement the MCP protocol with stdio transport.
  `);
  
  return command;
}

module.exports = { createCommand, mcpStdioAction };