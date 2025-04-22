// ABOUTME: MCP stdio transport implementation using JSON-RPC 2.0
// ABOUTME: Provides communication over stdin/stdout for MCP tools

const { createInterface } = require('readline');
const { getRegisteredTools } = require('./registration');

/**
 * MCP Stdio transport for communicating over stdin/stdout
 * Implements JSON-RPC 2.0 protocol
 */
class StdioTransport {
  /**
   * Create a new StdioTransport instance
   * 
   * @param {Object} options - Transport options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.tools = null;
    this.requestMap = new Map();
    this.nextRequestId = 1;
    this.debug = options.debug || false;
    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.stderr = process.stderr;
    this.readline = null;
    this.isRunning = false;
    this.onConnect = null;
    this.onDisconnect = null;
  }

  /**
   * Initialize the transport and start listening
   * 
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      return;
    }

    // Register all MCP tools
    this.tools = getRegisteredTools() || [];
    
    // Configure stdin for raw mode
    this.stdin.setEncoding('utf8');
    
    // Create readline interface
    this.readline = createInterface({
      input: this.stdin,
      output: null, // No output to avoid echoing
      terminal: false
    });
    
    // Set up line handling
    this.readline.on('line', this.handleLine.bind(this));
    this.readline.on('close', this.handleClose.bind(this));
    
    // Mark as running
    this.isRunning = true;
    
    // Send server info
    this.sendNotification('server/info', {
      name: 'issue-cards-mcp',
      version: require('../../package.json').version,
      capabilities: {
        tools: Array.isArray(this.tools) ? this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        })) : []
      }
    });
    
    // Log startup to stderr
    this.logDebug('MCP stdio server started');
    
    // Call connect handler if provided
    if (typeof this.onConnect === 'function') {
      this.onConnect();
    }
  }

  /**
   * Stop the transport
   * 
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }
    
    // Close readline interface
    if (this.readline) {
      this.readline.close();
      this.readline = null;
    }
    
    // Mark as not running
    this.isRunning = false;
    
    // Log shutdown to stderr
    this.logDebug('MCP stdio server stopped');
    
    // Call disconnect handler if provided
    if (typeof this.onDisconnect === 'function') {
      this.onDisconnect();
    }
  }

  /**
   * Handle a line of input from stdin
   * 
   * @param {string} line - The line of text
   */
  handleLine(line) {
    try {
      // Parse the JSON-RPC message
      const message = JSON.parse(line);
      
      // Process the message
      this.processMessage(message);
    } catch (error) {
      // Log parse errors to stderr
      this.logError(`Error parsing JSON-RPC message: ${error.message}`);
      
      // Send parse error response if we have an ID
      if (line && typeof line === 'string') {
        try {
          const parsed = JSON.parse(line);
          if (parsed && parsed.id) {
            this.sendErrorResponse(parsed.id, -32700, 'Parse error', { details: error.message });
          }
        } catch (e) {
          // If we can't extract ID, we can't send a proper response
          this.logError('Cannot extract request ID for error response');
        }
      }
    }
  }

  /**
   * Process a JSON-RPC message
   * 
   * @param {Object} message - JSON-RPC message
   */
  async processMessage(message) {
    // Check if this is a valid JSON-RPC 2.0 message
    if (message.jsonrpc !== '2.0') {
      return this.sendErrorResponse(
        message.id, 
        -32600, 
        'Invalid Request', 
        { details: 'Invalid or missing jsonrpc version' }
      );
    }
    
    // Handle request (has id and method)
    if (message.id !== undefined && message.method) {
      await this.handleRequest(message);
    }
    // Handle notification (has method but no id)
    else if (message.method && message.id === undefined) {
      await this.handleNotification(message);
    }
    // Handle response (has id but no method)
    else if (message.id !== undefined && !message.method) {
      this.handleResponse(message);
    }
    // Invalid message
    else {
      this.logError(`Invalid JSON-RPC message: ${JSON.stringify(message)}`);
      if (message.id) {
        this.sendErrorResponse(message.id, -32600, 'Invalid Request');
      }
    }
  }

  /**
   * Handle a JSON-RPC request
   * 
   * @param {Object} request - JSON-RPC request
   */
  async handleRequest(request) {
    const { id, method, params } = request;
    
    // Log the request to stderr
    this.logDebug(`Received request ${id}: ${method}`);
    
    try {
      // Handle tool execution request
      if (method === 'tools/execute') {
        await this.handleToolExecution(id, params);
        return;
      }
      
      // Handle server info request
      if (method === 'server/info') {
        this.sendResponse(id, {
          name: 'issue-cards-mcp',
          version: require('../../package.json').version,
          capabilities: {
            tools: this.tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            }))
          }
        });
        return;
      }
      
      // Handle get_tool_specs request - Claude CLI uses this method
      if (method === 'get_tool_specs') {
        this.sendResponse(id, {
          tools: this.tools.map(tool => ({
            name: tool.name,
            description: tool.description || 'No description available',
            input_schema: {
              type: 'object',
              properties: Object.fromEntries(
                (tool.parameters || []).map(param => [
                  param.name,
                  {
                    type: param.type || 'string',
                    description: param.description || ''
                  }
                ])
              ),
              required: (tool.parameters || [])
                .filter(param => param.required)
                .map(param => param.name)
            }
          }))
        });
        return;
      }
      
      // Method not found
      this.sendErrorResponse(id, -32601, 'Method not found', { method });
    } catch (error) {
      // Internal error
      this.logError(`Error handling request ${id}: ${error.message}`);
      this.sendErrorResponse(id, -32603, 'Internal error', { 
        message: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handle a JSON-RPC notification
   * 
   * @param {Object} notification - JSON-RPC notification
   */
  async handleNotification(notification) {
    const { method, params } = notification;
    
    // Log the notification to stderr
    this.logDebug(`Received notification: ${method}`);
    
    try {
      // Handle client/ready notification
      if (method === 'client/ready') {
        // Send server capabilities
        this.sendNotification('server/ready', {
          capabilities: {
            tools: Array.isArray(this.tools) ? this.tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            })) : []
          }
        });
        return;
      }
      
      // Unknown notification - log but don't error
      this.logError(`Unknown notification method: ${method}`);
    } catch (error) {
      // Just log errors for notifications
      this.logError(`Error handling notification ${method}: ${error.message}`);
    }
  }

  /**
   * Handle a JSON-RPC response
   * 
   * @param {Object} response - JSON-RPC response
   */
  handleResponse(response) {
    const { id, result, error } = response;
    
    // Log the response to stderr
    if (error) {
      this.logDebug(`Received error response for ${id}: ${error.message}`);
    } else {
      this.logDebug(`Received success response for ${id}`);
    }
    
    // Look up the pending request
    const pending = this.requestMap.get(id);
    if (!pending) {
      this.logError(`Received response for unknown request ID: ${id}`);
      return;
    }
    
    // Remove from pending requests
    this.requestMap.delete(id);
    
    // Resolve or reject the promise
    if (error) {
      pending.reject(new Error(error.message));
    } else {
      pending.resolve(result);
    }
  }

  /**
   * Handle a tool execution request
   * 
   * @param {string|number} id - Request ID
   * @param {Object} params - Request parameters
   */
  async handleToolExecution(id, params) {
    const { tool, args } = params;
    
    if (!tool) {
      return this.sendErrorResponse(id, -32602, 'Invalid params', { 
        details: 'Missing required parameter: tool' 
      });
    }
    
    if (!args || typeof args !== 'object') {
      return this.sendErrorResponse(id, -32602, 'Invalid params', { 
        details: 'Missing or invalid parameter: args (must be an object)' 
      });
    }
    
    // Find the tool implementation
    const toolDef = this.tools.find(t => t.name === tool);
    
    if (!toolDef) {
      return this.sendErrorResponse(id, -32602, 'Invalid params', { 
        details: `Unknown tool: ${tool}` 
      });
    }
    
    try {
      // Get the implementation
      const implementation = require('./tools')[toolDef.name];
      
      if (!implementation) {
        return this.sendErrorResponse(id, -32603, 'Internal error', { 
          details: `Tool implementation not found: ${tool}` 
        });
      }
      
      // Execute the tool with validation
      const result = await implementation(args);
      
      // Send the response
      this.sendResponse(id, result);
    } catch (error) {
      this.logError(`Error executing tool ${tool}: ${error.message}`);
      this.sendErrorResponse(id, -32603, 'Internal error', { 
        message: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handle connection close
   */
  handleClose() {
    this.logDebug('Connection closed');
    this.isRunning = false;
    
    // Call disconnect handler if provided
    if (typeof this.onDisconnect === 'function') {
      this.onDisconnect();
    }
  }

  /**
   * Send a JSON-RPC response
   * 
   * @param {string|number} id - Request ID
   * @param {Object} result - Response result
   */
  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };
    
    this.sendMessage(response);
  }

  /**
   * Send a JSON-RPC error response
   * 
   * @param {string|number} id - Request ID
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @param {Object} [data] - Additional error data
   */
  sendErrorResponse(id, code, message, data) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
    
    if (data) {
      response.error.data = data;
    }
    
    this.sendMessage(response);
  }

  /**
   * Send a JSON-RPC notification
   * 
   * @param {string} method - Notification method
   * @param {Object} [params] - Notification parameters
   */
  sendNotification(method, params) {
    const notification = {
      jsonrpc: '2.0',
      method
    };
    
    if (params) {
      notification.params = params;
    }
    
    this.sendMessage(notification);
  }

  /**
   * Send a JSON-RPC request
   * 
   * @param {string} method - Request method
   * @param {Object} [params] - Request parameters
   * @returns {Promise<Object>} Response result
   */
  sendRequest(method, params) {
    const id = this.nextRequestId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method
    };
    
    if (params) {
      request.params = params;
    }
    
    // Create a promise to handle the response
    const promise = new Promise((resolve, reject) => {
      this.requestMap.set(id, { resolve, reject });
    });
    
    // Send the request
    this.sendMessage(request);
    
    return promise;
  }

  /**
   * Send a JSON-RPC message
   * 
   * @param {Object} message - JSON-RPC message
   */
  sendMessage(message) {
    try {
      const json = JSON.stringify(message);
      this.logDebug(`Sending: ${json}`);
      this.stdout.write(json + '\n');
    } catch (error) {
      this.logError(`Error sending message: ${error.message}`);
    }
  }

  /**
   * Log a debug message to stderr
   * 
   * @param {string} message - Debug message
   */
  logDebug(message) {
    if (this.debug) {
      this.stderr.write(`[DEBUG] ${message}\n`);
    }
  }

  /**
   * Log an error message to stderr
   * 
   * @param {string} message - Error message
   */
  logError(message) {
    this.stderr.write(`[ERROR] ${message}\n`);
  }
}

module.exports = StdioTransport;