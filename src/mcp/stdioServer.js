// ABOUTME: MCP stdio server implementation for AI integrations
// ABOUTME: Handles stdio communication using JSON-RPC 2.0

const StdioTransport = require('./stdioTransport');
const { registerMcpTools } = require('./registration');

/**
 * Start the stdio MCP server
 * 
 * @param {Object} options - Server options
 * @param {boolean} [options.debug] - Enable debug logging
 * @param {boolean} [options.logging] - Enable JSONL logging to temp file
 * @param {string} [options.logPath] - Custom path for log file
 * @returns {Promise<Object>} The transport instance
 */
async function startStdioServer(options = {}) {
  // Register all MCP tools
  registerMcpTools();
  
  // Create and start the transport
  const transport = new StdioTransport({
    debug: options.debug || false,
    logging: options.logging !== false,
    logPath: options.logPath
  });
  
  // Define connect handler
  transport.onConnect = () => {
    transport.logDebug('MCP stdio server connected');
  };
  
  // Define disconnect handler
  transport.onDisconnect = () => {
    transport.logDebug('MCP stdio server disconnected');
    // Exit gracefully
    process.exit(0);
  };
  
  // Handle process signals
  process.on('SIGINT', async () => {
    transport.logDebug('Received SIGINT signal');
    await transport.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    transport.logDebug('Received SIGTERM signal');
    await transport.stop();
    process.exit(0);
  });
  
  // Start the transport
  await transport.start();
  
  return transport;
}

module.exports = {
  startStdioServer
};