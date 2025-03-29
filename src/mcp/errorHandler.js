// ABOUTME: Common error handling for MCP tools
// ABOUTME: Standardizes error responses and formats

/**
 * Create a standard error response for MCP tools
 * 
 * @param {string} type - Error type
 * @param {string} message - Error message
 * @param {Object} [details] - Additional error details
 * @returns {Object} Standardized error response
 */
function createErrorResponse(type, message, details = {}) {
  return {
    success: false,
    error: {
      type,
      message,
      ...details
    }
  };
}

/**
 * Create a validation error response
 * 
 * @param {string} message - Error message
 * @param {Object} [details] - Additional error details
 * @returns {Object} Validation error response
 */
function createValidationError(message, details = {}) {
  return createErrorResponse('ValidationError', message, details);
}

/**
 * Create a not found error response
 * 
 * @param {string} entity - Entity that wasn't found (e.g. 'Issue')
 * @param {string} [identifier] - Identifier of the entity
 * @returns {Object} Not found error response
 */
function createNotFoundError(entity, identifier) {
  const message = identifier
    ? `${entity} #${identifier} not found`
    : `${entity} not found`;
  
  return createErrorResponse('NotFoundError', message);
}

/**
 * Create an operation error response
 * 
 * @param {string} operation - The operation that failed
 * @param {string} message - Error message
 * @returns {Object} Operation error response
 */
function createOperationError(operation, message) {
  return createErrorResponse(
    `${operation.charAt(0).toUpperCase() + operation.slice(1)}Error`,
    message
  );
}

/**
 * Try-catch wrapper for MCP tools that creates standardized responses
 * 
 * @param {Function} toolFunction - The tool function to wrap
 * @param {string} operation - Operation name for error reporting
 * @returns {Function} Wrapped function with error handling
 */
function withErrorHandling(toolFunction, operation) {
  return async function(...args) {
    try {
      return await toolFunction(...args);
    } catch (error) {
      return createOperationError(operation, `Failed to ${operation}: ${error.message}`);
    }
  };
}

module.exports = {
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createOperationError,
  withErrorHandling
};