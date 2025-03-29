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
 * @param {Function} toolFunc - The tool function to wrap
 * @returns {Function} Wrapped function with validation
 */
function withValidation(toolFunc) {
  return async function(args) {
    // Get tool name from function name
    const toolName = this.name || toolFunc.name;
    
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