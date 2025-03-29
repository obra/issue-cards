// ABOUTME: Tests for MCP error handling utilities
// ABOUTME: Verifies standardized error responses and error handling wrappers

const {
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createOperationError,
  withErrorHandling
} = require('../../src/mcp/errorHandler');

describe('MCP Error Handler', () => {
  describe('createErrorResponse', () => {
    it('should create a standard error response', () => {
      const response = createErrorResponse('TestError', 'Test error message');
      
      expect(response).toEqual({
        success: false,
        error: {
          type: 'TestError',
          message: 'Test error message'
        }
      });
    });
    
    it('should include additional details if provided', () => {
      const response = createErrorResponse('TestError', 'Test error message', {
        code: 123,
        additional: 'info'
      });
      
      expect(response).toEqual({
        success: false,
        error: {
          type: 'TestError',
          message: 'Test error message',
          code: 123,
          additional: 'info'
        }
      });
    });
  });
  
  describe('createValidationError', () => {
    it('should create a validation error response', () => {
      const response = createValidationError('Invalid parameter');
      
      expect(response).toEqual({
        success: false,
        error: {
          type: 'ValidationError',
          message: 'Invalid parameter'
        }
      });
    });
    
    it('should include additional details if provided', () => {
      const response = createValidationError('Invalid parameter', {
        parameter: 'testParam',
        reason: 'Must be a string'
      });
      
      expect(response).toEqual({
        success: false,
        error: {
          type: 'ValidationError',
          message: 'Invalid parameter',
          parameter: 'testParam',
          reason: 'Must be a string'
        }
      });
    });
  });
  
  describe('createNotFoundError', () => {
    it('should create a not found error response', () => {
      const response = createNotFoundError('Issue');
      
      expect(response).toEqual({
        success: false,
        error: {
          type: 'NotFoundError',
          message: 'Issue not found'
        }
      });
    });
    
    it('should include identifier if provided', () => {
      const response = createNotFoundError('Issue', '0001');
      
      expect(response).toEqual({
        success: false,
        error: {
          type: 'NotFoundError',
          message: 'Issue #0001 not found'
        }
      });
    });
  });
  
  describe('createOperationError', () => {
    it('should create an operation error response', () => {
      const response = createOperationError('listIssues', 'Failed to fetch issues');
      
      expect(response).toEqual({
        success: false,
        error: {
          type: 'ListIssuesError',
          message: 'Failed to fetch issues'
        }
      });
    });
    
    it('should capitalize the first letter of the operation name', () => {
      const response = createOperationError('getTasks', 'Failed to retrieve tasks');
      
      expect(response.error.type).toBe('GetTasksError');
    });
  });
  
  describe('withErrorHandling', () => {
    it('should return the function result on success', async () => {
      // Create a mock function that succeeds
      const successFunc = jest.fn().mockResolvedValue({
        success: true,
        data: 'test data'
      });
      
      // Wrap with error handling
      const wrappedFunc = withErrorHandling(successFunc, 'testOperation');
      
      // Call the wrapped function
      const result = await wrappedFunc({ testArg: 'value' });
      
      // Verify the original function was called with args
      expect(successFunc).toHaveBeenCalledWith({ testArg: 'value' });
      
      // Verify the result was returned unchanged
      expect(result).toEqual({
        success: true,
        data: 'test data'
      });
    });
    
    it('should catch errors and return a standard error response', async () => {
      // Create a mock function that throws an error
      const errorFunc = jest.fn().mockRejectedValue(new Error('Something went wrong'));
      
      // Wrap with error handling
      const wrappedFunc = withErrorHandling(errorFunc, 'testOperation');
      
      // Call the wrapped function
      const result = await wrappedFunc({ testArg: 'value' });
      
      // Verify the error was caught and a proper response was returned
      expect(result).toEqual({
        success: false,
        error: {
          type: 'TestOperationError',
          message: 'Failed to testOperation: Something went wrong'
        }
      });
    });
  });
});