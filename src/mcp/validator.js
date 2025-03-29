// ABOUTME: Schema validation for MCP tool parameters
// ABOUTME: Uses JSON Schema to validate and process incoming arguments

const Ajv = require('ajv');
const { createValidationError } = require('./errorHandler');

// Create Ajv instance
const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  useDefaults: true
});

// Define schemas for each MCP tool
const schemas = {
  // Schema for mcp__listIssues
  mcp__listIssues: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        enum: ['open', 'closed', 'all'],
        default: 'all'
      }
    },
    additionalProperties: false
  },
  
  // Schema for mcp__showIssue
  mcp__showIssue: {
    type: 'object',
    properties: {
      issueNumber: {
        type: 'string',
        pattern: '^\\d{4}$'
      }
    },
    required: ['issueNumber'],
    additionalProperties: false
  },
  
  // Schema for mcp__getCurrentTask
  mcp__getCurrentTask: {
    type: 'object',
    properties: {},
    additionalProperties: false
  },
  
  // Schema for mcp__addTask
  mcp__addTask: {
    type: 'object',
    properties: {
      issueNumber: {
        type: 'string',
        pattern: '^\\d{4}$'
      },
      description: {
        type: 'string',
        minLength: 1
      }
    },
    required: ['issueNumber', 'description'],
    additionalProperties: false
  }
};

// Compile schemas
const validators = {};
Object.entries(schemas).forEach(([name, schema]) => {
  validators[name] = ajv.compile(schema);
});

/**
 * Validate arguments for a MCP tool
 * 
 * @param {string} toolName - The name of the tool
 * @param {Object} args - The arguments to validate
 * @returns {Object|null} Error response or null if valid
 */
function validateArgs(toolName, args) {
  const validator = validators[toolName];
  
  if (!validator) {
    return createValidationError(`No schema defined for tool: ${toolName}`);
  }
  
  const valid = validator(args);
  
  if (!valid) {
    const errors = validator.errors.map(err => {
      // Format error message
      let message = `${err.instancePath} ${err.message}`;
      if (err.instancePath === '') {
        message = err.message;
      }
      
      // Remove leading dot
      message = message.replace(/^\./, '');
      
      return message;
    });
    
    return createValidationError('Invalid arguments', {
      errors,
      details: validator.errors
    });
  }
  
  return null;
}

/**
 * Middleware that adds schema validation to MCP tools
 * 
 * @param {Function|string} toolFuncOrName - The tool function to wrap or explicit tool name
 * @param {Function} [actualFunc] - The actual function (when first param is a name)
 * @returns {Function} Wrapped function with validation
 */
function withValidation(toolFuncOrName, actualFunc) {
  let toolName;
  let toolFunc;
  
  // Handle both forms of the function:
  // 1. withValidation(func) - extract name from func
  // 2. withValidation('name', func) - use explicit name
  if (typeof toolFuncOrName === 'function') {
    toolFunc = toolFuncOrName;
    // Extract tool name from the function name - assumes it's mcp__something
    const fnName = toolFunc.name || '';
    toolName = fnName;
  } else if (typeof toolFuncOrName === 'string' && typeof actualFunc === 'function') {
    toolName = toolFuncOrName;
    toolFunc = actualFunc;
  } else {
    throw new Error('Invalid arguments to withValidation');
  }
  
  return async function(args) {
    // Determine tool name from module exports if not found
    if (!toolName) {
      // Try to find the tool name by checking what properties in the exports match this function
      const toolsModule = require('./tools');
      for (const [exportName, exportedFunc] of Object.entries(toolsModule)) {
        if (exportedFunc === this || exportedFunc.toString() === toolFunc.toString()) {
          toolName = exportName;
          break;
        }
      }
    }
    
    // Validate arguments
    const validationError = validateArgs(toolName, args);
    if (validationError) {
      return validationError;
    }
    
    // Execute tool with validated arguments
    return await toolFunc.call(this, args);
  };
}

module.exports = {
  validateArgs,
  withValidation,
  schemas
};