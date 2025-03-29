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
      tools: availableTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }))
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
    
    // Don't expose the implementation
    const { implementation, ...toolData } = tool;
    res.status(200).json(toolData);
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
  const { createValidationError } = require('./errorHandler');
  
  // Validate tool name
  if (!body.tool) {
    return res.status(400).json(
      createValidationError('Missing required parameter: tool')
    );
  }
  
  // Validate arguments
  if (!body.args || typeof body.args !== 'object') {
    return res.status(400).json(
      createValidationError('Missing or invalid parameter: args (must be an object)')
    );
  }
  
  // Find the requested tool
  const tool = availableTools.find(t => t.name === body.tool);
  
  // Validate that the requested tool exists
  if (!tool) {
    const { createNotFoundError } = require('./errorHandler');
    return res.status(200).json(
      createNotFoundError('Tool', body.tool)
    );
  }
  
  // Validate arguments against schema
  const { validateArgs } = require('./validator');
  const validationError = validateArgs(body.tool, body.args);
  
  if (validationError) {
    return res.status(200).json(validationError);
  }
  
  // Add the resolved tool to request for later use
  req.resolvedTool = tool;
  
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
  const { createNotFoundError, createOperationError } = require('./errorHandler');
  
  try {
    // Get resolved tool from middleware or find it
    const resolvedTool = req.resolvedTool || 
      availableTools.find(t => t.name === tool);
    
    if (!resolvedTool) {
      return res.status(200).json(
        createNotFoundError('Tool', tool)
      );
    }
    
    // Execute the tool implementation
    const result = await resolvedTool.implementation(args);
    
    // Return the result
    res.status(200).json(result);
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error.message);
    const errorResponse = createOperationError('Execution', `Error executing tool: ${error.message}`);
    res.status(200).json(errorResponse);
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
