// ABOUTME: MCP stdio transport implementation using JSON-RPC 2.0
// ABOUTME: Provides communication over stdin/stdout for MCP tools

const { createInterface } = require('readline');
const { getRegisteredTools } = require('./registration');
const McpLogger = require('../utils/mcpLogger');

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
   * @param {boolean} [options.logging=true] - Enable JSONL logging to temp file
   * @param {string} [options.logPath] - Custom path for log file
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
    
    // MCP protocol state
    this.initialized = false;
    this.shutdownRequested = false;
    this.clientCapabilities = null;
    this.protocolVersion = "2024-11-05"; // Previous MCP protocol version for backward compatibility
    
    // Initialize logger if enabled
    this.logging = options.logging !== false;
    if (this.logging) {
      this.logger = McpLogger.getInstance({
        logPath: options.logPath,
        enabled: true
      });
    }
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
    
    // Log startup to stderr
    this.logDebug('MCP stdio server started');
    
    // In MCP 2025-03-26, we should wait for client to send initialize request
    // For backward compatibility with Claude CLI, we also send server/info
    // This dual approach ensures we work with both standard MCP clients
    // and with the Claude CLI
    this.sendNotification('server/info', {
      name: 'issue-cards-mcp',
      version: require('../../package.json').version,
      capabilities: {
        // For backward compatibility with our tests
        tools: Array.isArray(this.tools) ? this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        })) : [],
        // New MCP format
        protocol_version: this.protocolVersion,
        tools_support: {
          supported: true
        },
        async_tools: {
          supported: false
        },
        resources: {
          supported: false
        },
        prompts: {
          supported: false
        }
      }
    });
    
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
    
    // Close logger if enabled
    if (this.logging && this.logger) {
      this.logger.close();
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
      
      // Log the raw input if logging is enabled
      if (this.logging && this.logger) {
        this.logger.logRequest(message);
      }
      
      // Check if this is a batch request (array of messages)
      if (Array.isArray(message)) {
        this.processBatchMessages(message);
      } else {
        // Process single message
        this.processMessage(message);
      }
    } catch (error) {
      // Log parse errors to stderr
      this.logError(`Error parsing JSON-RPC message: ${error.message}`);
      
      // Log the error if logging is enabled
      if (this.logging && this.logger) {
        this.logger.logError(error, { rawInput: line });
      }
      
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
   * Process a batch of JSON-RPC messages
   * 
   * @param {Array<Object>} messages - Array of JSON-RPC messages
   */
  async processBatchMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      // Empty batch - send invalid request error
      this.sendMessage({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request',
          data: { details: 'Empty batch request' }
        },
        id: null
      });
      return;
    }
    
    this.logDebug(`Processing batch of ${messages.length} messages`);
    
    // Process each message and collect responses
    const responses = [];
    
    for (const message of messages) {
      // For requests (with ID), we need to capture the response
      if (message.id !== undefined) {
        try {
          // Create a promise to capture the response
          const responsePromise = new Promise((resolve) => {
            // Override the sendMessage method temporarily to capture the response
            const originalSendMessage = this.sendMessage.bind(this);
            this.sendMessage = (response) => {
              resolve(response);
              // We don't actually send the response yet
            };
            
            // Process the message
            this.processMessage(message);
            
            // Restore the original sendMessage method
            this.sendMessage = originalSendMessage;
          });
          
          // Wait for the response and add it to the batch
          const response = await responsePromise;
          responses.push(response);
        } catch (error) {
          // Add error response to the batch
          responses.push({
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32603,
              message: 'Internal error',
              data: { message: error.message }
            }
          });
        }
      } else {
        // For notifications (no ID), just process them (no response needed)
        this.processMessage(message);
      }
    }
    
    // Send batch response if there are any responses to send
    if (responses.length > 0) {
      this.logDebug(`Sending batch response with ${responses.length} items`);
      const json = JSON.stringify(responses);
      this.stdout.write(json + '\n');
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
      // Handle tool execution requests
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
            // For backward compatibility with our tests
            tools: this.tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            })),
            // New MCP format
            protocol_version: this.protocolVersion,
            tools_support: {
              supported: true
            },
            async_tools: {
              supported: false
            },
            resources: {
              supported: false
            },
            prompts: {
              supported: false
            }
          }
        });
        return;
      }
      
      // Handle get_tool_specs request - Claude CLI uses this method
      if (method === 'get_tool_specs') {
        const toolSpecs = {
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
        };
        
        // Add content field for Claude CLI compatibility
        const formattedResponse = {
          ...toolSpecs,
          content: [JSON.stringify(toolSpecs)]
        };
        
        this.sendResponse(id, formattedResponse);
        return;
      }
      
      // Handle initialize request - Required by MCP spec
      if (method === 'initialize') {
        // Store client capabilities if provided
        if (params && params.capabilities) {
          this.clientCapabilities = params.capabilities;
        }
        
        // Send back server capabilities matching expected field names
        this.sendResponse(id, {
          protocolVersion: this.protocolVersion,
          capabilities: {
            tools: {
              supported: true
            }
            // Note: async_tools, resources, and prompts are 2025-03-26 features
            // Omitting them for 2024-11-05 compatibility
          },
          serverInfo: {
            name: 'issue-cards-mcp',
            version: require('../../package.json').version,
            description: 'Issue Cards MCP Server'
          }
        });
        return;
      }
      
      // Handle tools/list request - Required by MCP spec
      if (method === 'tools/list') {
        const toolsList = {
          tools: this.tools.map(tool => ({
            name: tool.name,
            description: tool.description || 'No description available',
            inputSchema: {
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
        };
        
        // Add content field for Claude CLI compatibility
        const formattedResponse = {
          ...toolsList,
          content: [JSON.stringify(toolsList)]
        };
        
        this.sendResponse(id, formattedResponse);
        return;
      }
      
      // Handle tools/call request - Required by MCP spec
      if (method === 'tools/call') {
        if (!params || !params.name) {
          return this.sendErrorResponse(id, -32602, 'Invalid params', { 
            details: 'Missing required parameter: name' 
          });
        }
        
        const toolName = params.name;
        const toolArgs = params.arguments || {};
        
        await this.handleToolExecution(id, {
          tool: toolName,
          args: toolArgs
        });
        return;
      }
      
      // Handle shutdown request - Required by MCP spec
      if (method === 'shutdown') {
        this.shutdownRequested = true;
        this.sendResponse(id, null);
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
      
      // Handle initialized notification - Required by MCP spec
      if (method === 'initialized') {
        // Mark as initialized
        this.initialized = true;
        this.logDebug('Client initialized');
        return;
      }
      
      // Handle client/exit notification - Required by MCP spec
      if (method === 'client/exit' || method === 'exit') {
        if (this.shutdownRequested) {
          this.logDebug('Client requested exit after shutdown');
          // Stop the transport
          await this.stop();
        } else {
          this.logDebug('Client requested exit without shutdown');
          // We should still stop since the client is exiting
          await this.stop();
        }
        return;
      }
      
      // Handle $/cancelRequest notification - Required by MCP spec for async tools
      if (method === '$/cancelRequest') {
        if (params && params.id) {
          this.logDebug(`Request cancellation received for id: ${params.id}`);
          // We don't support async cancellation yet, but acknowledge the request
        }
        return;
      }
      
      // Unknown notification - log but don't error
      this.logDebug(`Unknown notification method: ${method}`);
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
      // Get access to all MCP tools
      const { getRegisteredTools } = require('./registration');
      const allTools = getRegisteredTools();
      
      // Find the tool with implementation
      const registeredTool = allTools.find(t => t.name === tool);
      
      if (!registeredTool || !registeredTool.implementation) {
        // Fallback to direct requires if not found
        let implementation = require('./tools')[toolDef.name];
        
        // If not found in tools.js, check onboardingTools.js
        if (!implementation) {
          implementation = require('./onboardingTools')[toolDef.name];
        }
        
        if (!implementation) {
          return this.sendErrorResponse(id, -32603, 'Internal error', { 
            details: `Tool implementation not found: ${tool}` 
          });
        }
        
        // Execute the tool with validation
        const result = await implementation(args);
        
        // Format the result to match Claude's expected format
        // Claude CLI expects a result with a content field
        const formattedResult = this.formatToolResponse(result);
        
        // Send the response
        this.sendResponse(id, formattedResult);
      } else {
        // Use the implementation from the registered tool
        const result = await registeredTool.implementation(args);
        
        // Format the result to match Claude's expected format
        const formattedResult = this.formatToolResponse(result);
        
        // Send the response
        this.sendResponse(id, formattedResult);
      }
    } catch (error) {
      this.logError(`Error executing tool ${tool}: ${error.message}`);
      
      // Log the error if logging is enabled
      if (this.logging && this.logger) {
        this.logger.logError(error, {
          tool,
          args,
          phase: 'tool_execution'
        });
      }
      
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
      
      // Log the response if logging is enabled and it's a response (has id)
      if (this.logging && this.logger && (message.id !== undefined || message.error)) {
        this.logger.logResponse(message);
      }
    } catch (error) {
      this.logError(`Error sending message: ${error.message}`);
      
      // Log the error if logging is enabled
      if (this.logging && this.logger) {
        this.logger.logError(error, { messageAttempt: message });
      }
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
  
  /**
   * Format tool response to match Claude's expected format
   * 
   * @param {Object} result - Tool execution result
   * @returns {Object} Formatted tool result for Claude
   */
  formatToolResponse(result) {
    // Most basic format that should work with Claude CLI
    const formattedResult = {
      content: [
        {
          type: "text",
          text: JSON.stringify(result || {})
        }
      ]
    };
    
    return formattedResult;
  }
}

module.exports = StdioTransport;