// ABOUTME: Tests for MCP parameter validation
// ABOUTME: Verifies JSON schema validation for MCP tools

const {
  validateArgs,
  withValidation,
  schemas
} = require('../../src/mcp/validator');

describe('MCP Validator', () => {
  describe('schema definitions', () => {
    it('should have a schema for each MCP tool', () => {
      // Check that we have schemas for all core tools
      expect(schemas).toHaveProperty('mcp__listIssues');
      expect(schemas).toHaveProperty('mcp__showIssue');
      expect(schemas).toHaveProperty('mcp__getCurrentTask');
      expect(schemas).toHaveProperty('mcp__addTask');
      
      // Check schema structure
      expect(schemas.mcp__listIssues).toHaveProperty('type', 'object');
      expect(schemas.mcp__listIssues).toHaveProperty('properties');
      expect(schemas.mcp__listIssues.properties).toHaveProperty('state');
    });
  });
  
  describe('validateArgs', () => {
    it('should validate mcp__listIssues arguments correctly', () => {
      // Valid arguments
      expect(validateArgs('mcp__listIssues', { state: 'open' })).toBeNull();
      expect(validateArgs('mcp__listIssues', { state: 'closed' })).toBeNull();
      expect(validateArgs('mcp__listIssues', { state: 'all' })).toBeNull();
      expect(validateArgs('mcp__listIssues', {})).toBeNull(); // Default state should be applied
      
      // Invalid arguments
      const invalidStateError = validateArgs('mcp__listIssues', { state: 'invalid' });
      expect(invalidStateError).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError'
        }
      });
      
      // Extra properties
      const extraPropsError = validateArgs('mcp__listIssues', { state: 'open', extra: 'property' });
      expect(extraPropsError).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError'
        }
      });
    });
    
    it('should validate mcp__showIssue arguments correctly', () => {
      // Valid arguments
      expect(validateArgs('mcp__showIssue', { issueNumber: '0001' })).toBeNull();
      
      // Invalid arguments - missing required
      const missingError = validateArgs('mcp__showIssue', {});
      expect(missingError).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError'
        }
      });
      
      // Invalid arguments - wrong format
      const wrongFormatError = validateArgs('mcp__showIssue', { issueNumber: '1' });
      expect(wrongFormatError).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError'
        }
      });
    });
    
    it('should validate mcp__getCurrentTask arguments correctly', () => {
      // Valid arguments - empty object
      expect(validateArgs('mcp__getCurrentTask', {})).toBeNull();
      
      // Invalid arguments - extra properties
      const extraPropsError = validateArgs('mcp__getCurrentTask', { someExtra: 'prop' });
      expect(extraPropsError).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError'
        }
      });
    });
    
    it('should validate mcp__addTask arguments correctly', () => {
      // Valid arguments
      expect(validateArgs('mcp__addTask', { 
        issueNumber: '0001', 
        description: 'Test task' 
      })).toBeNull();
      
      // Invalid arguments - missing required
      const missingError = validateArgs('mcp__addTask', { issueNumber: '0001' });
      expect(missingError).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError'
        }
      });
      
      // Invalid arguments - empty description
      const emptyDescError = validateArgs('mcp__addTask', { 
        issueNumber: '0001', 
        description: '' 
      });
      expect(emptyDescError).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError'
        }
      });
    });
    
    it('should return error for undefined schema', () => {
      const error = validateArgs('non_existent_tool', {});
      expect(error).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError',
          message: expect.stringContaining('No schema defined')
        }
      });
    });
  });
  
  describe('withValidation', () => {
    it('should add validation to a tool function', async () => {
      // Mock tool function
      const mockTool = jest.fn().mockResolvedValue({
        success: true,
        data: 'result'
      });
      
      // Bind the tool name so validation works
      Object.defineProperty(mockTool, 'name', { value: 'mcp__listIssues' });
      
      // Apply validation
      const validatedTool = withValidation(mockTool);
      
      // Call with valid args
      const result = await validatedTool({ state: 'open' });
      
      // Should call the original function and return its result
      expect(mockTool).toHaveBeenCalledWith({ state: 'open' });
      expect(result).toEqual({
        success: true,
        data: 'result'
      });
    });
    
    it('should return validation error without calling the tool', async () => {
      // Mock tool function
      const mockTool = jest.fn().mockResolvedValue({
        success: true,
        data: 'result'
      });
      
      // Bind the tool name
      Object.defineProperty(mockTool, 'name', { value: 'mcp__showIssue' });
      
      // Apply validation
      const validatedTool = withValidation(mockTool);
      
      // Call with invalid args
      const result = await validatedTool({ invalidArg: 'value' });
      
      // Should not call the original function
      expect(mockTool).not.toHaveBeenCalled();
      
      // Should return validation error
      expect(result).toMatchObject({
        success: false,
        error: {
          type: 'ValidationError'
        }
      });
    });
  });
});