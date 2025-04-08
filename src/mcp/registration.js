// ABOUTME: MCP tool registration and request handling
// ABOUTME: Manages tool metadata, validation and execution

// Import tool implementations
const mcpTools = require('./tools');
const onboardingTools = require('./onboardingTools');

// Merge all MCP tools into a single object
const allMcpTools = {
  ...mcpTools,
  ...onboardingTools
};

// Storage for registered tools
const registeredTools = [];

/**
 * Register all available MCP tools
 * 
 * @returns {Array<Object>} Array of registered tools with metadata
 */
function registerMcpTools() {
  // Clear existing registrations
  registeredTools.length = 0;
  
  // Extract and register each MCP tool
  Object.entries(allMcpTools).forEach(([name, implementation]) => {
    // Only register functions that follow the mcp__ naming convention
    if (typeof implementation === 'function' && name.startsWith('mcp__')) {
      // Get function metadata from comments if available
      const metadata = extractToolMetadata(implementation);
      
      // Add to registry
      registeredTools.push({
        name,
        implementation,
        description: metadata.description || 'No description available',
        parameters: metadata.parameters || []
      });
    }
  });
  
  return registeredTools;
}

/**
 * Extract tool metadata from function
 * 
 * @param {Function} func - The function to extract metadata from
 * @returns {Object} Tool metadata
 */
function extractToolMetadata(func) {
  // Default metadata
  const metadata = {
    description: '',
    parameters: []
  };
  
  // Try to get documentation from function toString
  const funcString = func.toString();
  
  // Extract description from comment
  const descMatch = /\/\*\*\s*\n\s*\*\s*(.*?)\s*\n/s.exec(funcString);
  if (descMatch && descMatch[1]) {
    metadata.description = descMatch[1].trim();
  }
  
  // Extract parameters from comment
  const paramMatches = funcString.matchAll(/@param\s*{([^}]*)}\s*(\[[^\]]*\]|\S+)\s*-\s*(.*?)(?=\n\s*\*|$)/gs);
  for (const match of paramMatches) {
    let [, type, name, description] = match;
    
    // Skip args parent object
    if (name === 'args') continue;
    
    // Handle args.param notation
    if (name.startsWith('args.')) {
      name = name.replace('args.', '');
      
      // Handle optional parameters indicated by []
      const isOptional = name.startsWith('[') && name.includes(']');
      if (isOptional) {
        name = name.replace(/^\[|\]$/g, ''); // Remove [] brackets
      }
      
      // Add parameters with properties determined from comments
      metadata.parameters.push({
        name,
        type: type.toLowerCase(),
        description: description.trim(),
        required: !isOptional && description.toLowerCase().includes('required')
      });
    }
  }
  
  // Handle specific tools by name if extraction fails
  if (metadata.parameters.length === 0 && func.name) {
    // Add known parameters for specific tools
    if (func.name === 'mcp__listIssues') {
      metadata.parameters.push({
        name: 'state',
        type: 'string',
        description: 'Filter by issue state (open, closed, all)',
        required: false
      });
    } else if (func.name === 'mcp__showIssue') {
      metadata.parameters.push({
        name: 'issueNumber',
        type: 'string',
        description: 'The issue number to show',
        required: true
      });
    } else if (func.name === 'mcp__addTask') {
      metadata.parameters.push({
        name: 'issueNumber',
        type: 'string',
        description: 'The issue number to add the task to',
        required: true
      });
      metadata.parameters.push({
        name: 'description',
        type: 'string',
        description: 'The task description',
        required: true
      });
    }
  }
  
  return metadata;
}

/**
 * Get list of registered tools
 * 
 * @returns {Array<Object>} Array of registered tools
 */
function getRegisteredTools() {
  // Initialize tools if empty
  if (registeredTools.length === 0) {
    registerMcpTools();
  }
  
  // Return copy without implementation functions
  return registeredTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

/**
 * Validate incoming tool execution requests
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
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
  
  // Initialize tools if needed
  if (registeredTools.length === 0) {
    registerMcpTools();
  }
  
  // Find the requested tool
  const tool = registeredTools.find(t => t.name === body.tool);
  
  // Validate that the tool exists
  if (!tool) {
    return res.status(404).json({
      error: 'Tool not found',
      message: `No tool found with name: ${body.tool}`
    });
  }
  
  // Validate required parameters
  const missingParams = tool.parameters
    .filter(param => param.required && !body.args.hasOwnProperty(param.name))
    .map(param => param.name);
  
  if (missingParams.length > 0) {
    return res.status(400).json({
      error: 'Missing required parameters',
      parameters: missingParams
    });
  }
  
  // Add the resolved tool to request for later use
  req.resolvedTool = tool;
  
  // All validations passed
  next();
}

/**
 * Execute the requested tool
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function executeToolRequest(req, res) {
  try {
    const { tool, args } = req.body;
    const resolvedTool = req.resolvedTool || 
      registeredTools.find(t => t.name === tool);
    
    if (!resolvedTool) {
      return res.status(404).json({
        error: 'Tool not found',
        message: `No tool found with name: ${tool}`
      });
    }
    
    // Execute the tool
    const result = await resolvedTool.implementation(args);
    
    // Return the result
    res.status(200).json(result);
  } catch (error) {
    // Handle unexpected errors
    console.error(`Error executing tool:`, error);
    res.status(500).json({
      error: 'Tool execution failed',
      message: error.message
    });
  }
}

module.exports = {
  registerMcpTools,
  getRegisteredTools,
  validateToolRequest,
  executeToolRequest,
  
  // Expose for testing
  __test__: {
    extractToolMetadata
  }
};