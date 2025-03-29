// ABOUTME: Core MCP server functionality for AI integrations
// ABOUTME: Handles server creation, middleware, and tool registration

const express = require('express');
const http = require('http');
const { setupHealthCheck, setupApiRoutes } = require('./mcpEndpoints');

/**
 * Create an Express server application with configured middleware and routes
 * 
 * @param {Object} options - Server options
 * @param {string} options.token - Optional authentication token
 * @param {boolean} options.enableCors - Whether to enable CORS
 * @returns {Express.Application} The configured Express app
 */
function createServer(options = {}) {
  // Create Express app
  const app = express();
  
  // Configure middleware
  configureMiddleware(app, options);
  
  // Set up API routes
  const apiRouter = express.Router();
  setupHealthCheck(apiRouter);
  setupApiRoutes(apiRouter);
  
  // Mount API router at /api
  app.use('/api', apiRouter);
  
  // Handle 404 errors
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `No resource found at ${req.url}`
    });
  });
  
  return app;
}

/**
 * Configure Express middleware for the application
 * 
 * @param {Express.Application} app - Express app instance
 * @param {Object} options - Middleware options
 * @param {boolean} options.enableCors - Whether to enable CORS
 * @returns {Express.Application} The configured app
 */
function configureMiddleware(app, options = {}) {
  // Parse JSON body
  app.use(express.json());
  
  // Parse URL encoded bodies
  app.use(express.urlencoded({ extended: true }));
  
  // Add CORS headers if enabled
  if (options.enableCors) {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        return res.status(200).json({});
      }
      next();
    });
  }
  
  // Add authentication middleware if token is provided
  if (options.token) {
    app.use('/api', authMiddleware(options.token));
  }
  
  // Add error handling middleware - should be last
  app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });
  
  return app;
}

/**
 * Authentication middleware factory that validates tokens
 * 
 * @param {string} validToken - The token to validate against
 * @returns {Function} Express middleware function
 */
function authMiddleware(validToken) {
  return (req, res, next) => {
    // Skip auth for health check endpoint
    if (req.path === '/health') {
      return next();
    }
    
    // Check for token in query params
    if (req.query.token === validToken) {
      return next();
    }
    
    // Check for token in authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      if (token === validToken) {
        return next();
      }
    }
    
    // Token is invalid or missing
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required'
    });
  };
}

/**
 * Register tool execution routes
 * 
 * @param {Express.Router} router - Express router to register routes on
 * @returns {Array<Object>} Array of registered tools with metadata
 */
function registerTools(router) {
  // Use the registration system to get all tools
  const { registerMcpTools } = require('./registration');
  
  // Get all registered tools
  return registerMcpTools();
}

/**
 * Start the server on the specified port and host
 * 
 * @param {Object} options - Server options
 * @param {number} options.port - Port to listen on
 * @param {string} options.host - Host to bind to
 * @param {string} options.token - Optional authentication token
 * @returns {http.Server} HTTP server instance
 */
function startServer(options) {
  const app = createServer({
    token: options.token,
    enableCors: true
  });
  
  // Create HTTP server
  const server = http.createServer(app);
  
  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${options.port} is already in use`);
    } else {
      console.error('Server error:', error.message);
    }
  });
  
  // Add ability to forcefully destroy connections (for testing)
  const connections = new Set();
  server.on('connection', (connection) => {
    connections.add(connection);
    connection.on('close', () => {
      connections.delete(connection);
    });
  });
  
  server.destroy = function() {
    for (const connection of connections) {
      connection.destroy();
    }
    connections.clear();
  };
  
  // Start listening
  server.listen(options.port, options.host, () => {
    const addr = server.address();
    console.log(`MCP server listening on ${addr.address}:${addr.port}`);
  });
  
  return server;
}

/**
 * Stop the server gracefully
 * 
 * @param {http.Server} server - Server instance to stop
 * @returns {Promise<void>} Promise that resolves when server is stopped
 */
function stopServer(server) {
  return new Promise((resolve) => {
    if (!server) {
      return resolve();
    }
    
    // Check if server is already closed
    if (!server.listening) {
      return resolve();
    }
    
    // Use a hard timeout to prevent test hanging
    const forceTimeout = setTimeout(() => {
      process.removeListener('uncaughtException', uncaughtExceptionHandler);
      resolve();
    }, 1000);
    
    // Handle any errors during close
    const uncaughtExceptionHandler = (err) => {
      // Ignore ECONNRESET errors which are common during server shutdown
      if (err.code !== 'ECONNRESET') {
        console.error('Error during server shutdown:', err.message);
      }
    };
    
    // Listen for uncaught exceptions during the close process
    process.on('uncaughtException', uncaughtExceptionHandler);
    
    try {
      // First close the server to stop accepting new connections
      server.close(() => {
        clearTimeout(forceTimeout);
        process.removeListener('uncaughtException', uncaughtExceptionHandler);
        resolve();
      });
      
      // Immediately terminate all connections
      // This is not ideal for production but works well for tests
      if (typeof server.destroy === 'function') {
        server.destroy();
      }
    } catch (err) {
      // If any synchronous errors occur, still clean up and resolve
      clearTimeout(forceTimeout);
      process.removeListener('uncaughtException', uncaughtExceptionHandler);
      resolve();
    }
  });
}

module.exports = {
  createServer,
  configureMiddleware,
  registerTools,
  startServer,
  stopServer,
  authMiddleware
};
