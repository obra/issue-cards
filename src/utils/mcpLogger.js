// ABOUTME: Logger utility for MCP communication
// ABOUTME: Logs all MCP input and output as JSONL to a temporary file

const fs = require('fs');
const path = require('path');
const os = require('os');

class McpLogger {
  /**
   * Creates a new McpLogger instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.logPath] - Path to log file, defaults to temp dir
   * @param {boolean} [options.enabled=true] - Whether logging is enabled
   */
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    
    // Default to a temp file if no log path is specified
    if (!options.logPath) {
      const tempDir = os.tmpdir();
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      this.logPath = path.join(tempDir, `issue-cards-mcp-${timestamp}.jsonl`);
    } else {
      this.logPath = options.logPath;
    }
    
    this.writeStream = null;
    this.initLogFile();
  }
  
  /**
   * Initialize the log file
   */
  initLogFile() {
    if (!this.enabled) return;
    
    try {
      // Create write stream in append mode
      this.writeStream = fs.createWriteStream(this.logPath, { flags: 'a' });
      
      // Write header with metadata
      const header = {
        type: 'meta',
        timestamp: new Date().toISOString(),
        version: require('../../package.json').version,
        pid: process.pid,
        platform: os.platform(),
        node: process.version
      };
      
      this.writeStream.write(JSON.stringify(header) + '\n');
    } catch (error) {
      console.error(`[MCP Logger] Failed to initialize log file: ${error.message}`);
      this.enabled = false;
    }
  }
  
  /**
   * Log an incoming MCP request
   * 
   * @param {Object} request - The MCP request object
   */
  logRequest(request) {
    if (!this.enabled || !this.writeStream) return;
    
    try {
      const logEntry = {
        type: 'request',
        timestamp: new Date().toISOString(),
        data: request
      };
      
      this.writeStream.write(JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error(`[MCP Logger] Failed to log request: ${error.message}`);
    }
  }
  
  /**
   * Log an outgoing MCP response
   * 
   * @param {Object} response - The MCP response object
   */
  logResponse(response) {
    if (!this.enabled || !this.writeStream) return;
    
    try {
      const logEntry = {
        type: 'response',
        timestamp: new Date().toISOString(),
        data: response
      };
      
      this.writeStream.write(JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error(`[MCP Logger] Failed to log response: ${error.message}`);
    }
  }
  
  /**
   * Log an error that occurred during MCP processing
   * 
   * @param {Error} error - The error object
   * @param {Object} [context] - Additional context information
   */
  logError(error, context = {}) {
    if (!this.enabled || !this.writeStream) return;
    
    try {
      const logEntry = {
        type: 'error',
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context
      };
      
      this.writeStream.write(JSON.stringify(logEntry) + '\n');
    } catch (err) {
      console.error(`[MCP Logger] Failed to log error: ${err.message}`);
    }
  }
  
  /**
   * Close the log file
   */
  close() {
    if (this.writeStream) {
      try {
        // Write footer with metadata
        const footer = {
          type: 'meta',
          event: 'shutdown',
          timestamp: new Date().toISOString()
        };
        
        this.writeStream.write(JSON.stringify(footer) + '\n');
        this.writeStream.end();
      } catch (error) {
        console.error(`[MCP Logger] Failed to close log file: ${error.message}`);
      }
    }
  }
  
  /**
   * Create a singleton instance of the logger
   * 
   * @param {Object} options - Configuration options
   * @returns {McpLogger} The singleton logger instance
   */
  static getInstance(options = {}) {
    if (!McpLogger.instance) {
      McpLogger.instance = new McpLogger(options);
    }
    return McpLogger.instance;
  }
}

module.exports = McpLogger;