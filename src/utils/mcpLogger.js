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
        node: process.version,
        logPath: this.logPath // Include log path in the log itself for reference
      };
      
      this.writeStream.write(JSON.stringify(header) + '\n');
    } catch (error) {
      // Cannot use console.error in stdio mode as it would write to stderr
      // Just disable logging silently
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
      // Cannot use console.error in stdio mode
      // Just silently fail
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
      // Cannot use console.error in stdio mode
      // Just silently fail
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
      // Cannot use console.error as it would write to stderr, interfering with MCP protocol
      // Just silently fail
    }
  }
  
  /**
   * Log a general message
   * 
   * @param {string} level - Message level (info, debug, error, etc.)
   * @param {string} message - The message to log
   * @param {Object} [context] - Additional context information
   */
  logMessage(level, message, context = {}) {
    if (!this.enabled || !this.writeStream) return;
    
    try {
      // Check if the stream is still writable
      if (this.writeStream.writable && !this.writeStream.closed && !this.writeStream.destroyed) {
        const logEntry = {
          type: 'message',
          level,
          timestamp: new Date().toISOString(),
          message,
          context
        };
        
        this.writeStream.write(JSON.stringify(logEntry) + '\n');
      }
    } catch (err) {
      // Cannot use console.error as it would write to stderr, interfering with MCP protocol
      // Just silently fail
    }
  }
  
  /**
   * Close the log file
   */
  close() {
    if (!this.enabled || !this.writeStream) return;
    
    try {
      // Write footer with metadata
      const footer = {
        type: 'meta',
        event: 'shutdown',
        timestamp: new Date().toISOString()
      };
      
      // Get a local reference before nullifying
      const stream = this.writeStream;
      this.writeStream = null;
      this.enabled = false;
      
      // Write footer and close using the local reference
      if (stream && stream.writable && !stream.closed && !stream.destroyed) {
        stream.write(JSON.stringify(footer) + '\n');
        stream.end();
      }
    } catch (error) {
      // Cannot use console.error in stdio mode
      // Just silently fail
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