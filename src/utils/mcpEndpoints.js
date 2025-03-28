// ABOUTME: MCP server API endpoints and request handlers
// ABOUTME: Manages health check and tool execution routes

const { executeCommand } = require('../index');
const pkg = require('../../package.json');

// Store for registered tools
let availableTools = [];

/**
 * Setup health check endpoint
 * 
 * @param {Express.Router} router - The Express router to attach the endpoint to
 */
function setupHealthCheck(router) {
  router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      version: pkg.version,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Setup API routes for tool execution and status
 * 
 * @param {Express.Router} router - Express router to attach endpoints to
 */
function setupApiRoutes(router) {
  // Register all available tools
  const { registerTools } = require('./mcpServer');
  availableTools = registerTools(router);
  
  // Tool execution endpoint
  router.post('/tools/execute', validateToolRequest, toolExecutionHandler);
  
  // Server status endpoint
  router.get('/status', statusHandler);
  
  // Tool details endpoint
  router.get('/tools', (req, res) => {
    res.status(200).json({
      count: availableTools.length,
      tools: availableTools
    });
  });
  
  // Individual tool details
  router.get('/tools/:name', (req, res) => {
    const { name } = req.params;
    const tool = availableTools.find(t => t.name === name);
    
    if (!tool) {
      return res.status(404).json({
        error: 'Tool not found',
        message: `No tool found with name: ${name}`
      });
    }
    
    res.status(200).json(tool);
  });
}

/**
 * Validate incoming tool execution requests
 * 
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function validateToolRequest(req, res, next) {
  const { body } = req;
  
  // Validate tool name
  if (!body.tool) {
    return res.status(400).json({
      error: 'Missing required parameter: tool'
    });
  }
  
  // Validate arguments
  if (!body.args || typeof body.args !== 'object') {
    return res.status(400).json({
      error: 'Missing or invalid parameter: args (must be an object)'
    });
  }
  
  // Validate that the requested tool exists
  const toolExists = availableTools.some(tool => tool.name === body.tool);
  if (!toolExists) {
    return res.status(404).json({
      error: 'Tool not found',
      message: `No tool found with name: ${body.tool}`
    });
  }
  
  // Proceed to next middleware
  next();
}

/**
 * Handle tool execution requests
 * 
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 */
async function toolExecutionHandler(req, res) {
  const { tool, args } = req.body;
  
  try {
    // Execute the requested command
    const result = await executeCommand(tool, args);
    
    // Return the result
    res.status(200).json(result);
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error.message);
    res.status(500).json({
      error: 'Tool execution failed',
      message: error.message
    });
  }
}

/**
 * Handle server status requests
 * 
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 */
function statusHandler(req, res) {
  // Get basic server information
  const serverInfo = {
    status: 'running',
    version: pkg.version,
    timestamp: new Date().toISOString(),
    tools: getAvailableTools()
  };
  
  res.status(200).json(serverInfo);
}

/**
 * Get list of available tools
 * 
 * @returns {Array<Object>} List of available tools with metadata
 */
function getAvailableTools() {
  return availableTools.map(tool => ({
    name: tool.name,
    description: tool.description
  }));
}

module.exports = {
  setupHealthCheck,
  setupApiRoutes,
  validateToolRequest,
  toolExecutionHandler,
  statusHandler,
  getAvailableTools
};
