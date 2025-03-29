// ABOUTME: Tests for MCP tool registration and interface
// ABOUTME: Verifies tool registration, parameter validation, and request handling

const { 
  registerMcpTools,
  validateToolRequest,
  executeToolRequest,
  getRegisteredTools
} = require('../../src/mcp/registration');

// Mock MCP tools with implementations that simulate the right JSDoc structure
jest.mock('../../src/mcp/tools', () => {
  // Create a mock function that preserves comment structure for parsing
  const mockListIssues = jest.fn().mockImplementation(async (args) => {});
  Object.defineProperty(mockListIssues, 'name', { value: 'mcp__listIssues' });
  
  const mockShowIssue = jest.fn().mockImplementation(async (args) => {});
  Object.defineProperty(mockShowIssue, 'name', { value: 'mcp__showIssue' });
  
  const mockGetCurrentTask = jest.fn().mockImplementation(async (args) => {});
  Object.defineProperty(mockGetCurrentTask, 'name', { value: 'mcp__getCurrentTask' });
  
  const mockAddTask = jest.fn().mockImplementation(async (args) => {});
  Object.defineProperty(mockAddTask, 'name', { value: 'mcp__addTask' });
  
  return {
    mcp__listIssues: mockListIssues,
    mcp__showIssue: mockShowIssue,
    mcp__getCurrentTask: mockGetCurrentTask,
    mcp__addTask: mockAddTask
  };
});

// Import the mocked tools
const {
  mcp__listIssues,
  mcp__showIssue,
  mcp__getCurrentTask,
  mcp__addTask
} = require('../../src/mcp/tools');

// Mock express request/response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('MCP Tool Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('registerMcpTools', () => {
    it('should register MCP tools and return tool metadata', () => {
      // This will fail until registration is implemented
      const toolRegistry = registerMcpTools();
      
      // Verify number of registered tools
      expect(toolRegistry.length).toBeGreaterThanOrEqual(4);
      
      // Verify essential tools are registered
      const registeredTools = toolRegistry.map(tool => tool.name);
      expect(registeredTools).toContain('mcp__listIssues');
      expect(registeredTools).toContain('mcp__showIssue');
      expect(registeredTools).toContain('mcp__getCurrentTask');
      expect(registeredTools).toContain('mcp__addTask');
      
      // Verify tool registration data format
      const listTool = toolRegistry.find(tool => tool.name === 'mcp__listIssues');
      expect(listTool).toHaveProperty('description');
      expect(listTool).toHaveProperty('parameters');
      expect(listTool.parameters).toContainEqual(
        expect.objectContaining({
          name: 'state',
          type: 'string',
          required: false
        })
      );
    });
    
    it('should extract metadata from function comments when available', () => {
      // Mock a function with JSDoc comments
      const mockFunc = function() {
        /* This comment should be ignored */
      };
      mockFunc.toString = () => `/**
 * Test function description
 * 
 * @param {Object} args - Arguments
 * @param {string} args.testParam - A test parameter
 * @param {number} args.optionalParam - An optional parameter
 * @returns {Object} Test result
 */
function mockFunc(args) {
  // Function body
}`;
      
      // Access the private extractToolMetadata function
      const extractToolMetadata = require('../../src/mcp/registration').__test__.extractToolMetadata;
      
      // Extract metadata
      const metadata = extractToolMetadata(mockFunc);
      
      // Verify extracted description
      expect(metadata.description).toBe('Test function description');
      
      // Verify extracted parameters
      expect(metadata.parameters).toHaveLength(2);
      expect(metadata.parameters[0]).toMatchObject({
        name: 'testParam',
        type: 'string',
        description: 'A test parameter'
      });
      expect(metadata.parameters[1]).toMatchObject({
        name: 'optionalParam',
        type: 'number',
        description: 'An optional parameter'
      });
    });
    
    it('should provide access to registered tools', () => {
      // Register tools first
      registerMcpTools();
      
      // Get registered tools
      const tools = getRegisteredTools();
      
      // Verify tools are accessible
      expect(tools).toBeInstanceOf(Array);
      expect(tools.length).toBeGreaterThanOrEqual(4);
      expect(tools.find(t => t.name === 'mcp__listIssues')).toBeTruthy();
    });
  });
  
  describe('validateToolRequest', () => {
    it('should validate tool requests with required parameters', () => {
      // Register tools first
      registerMcpTools();
      
      // Mock implementation that creates a tool with a required parameter
      jest.spyOn(require('../../src/mcp/registration'), 'getRegisteredTools').mockImplementationOnce(() => {
        return [{
          name: 'mcp__showIssue',
          description: 'Show issue details',
          parameters: [
            {
              name: 'issueNumber',
              type: 'string',
              description: 'The issue number to show',
              required: true
            }
          ]
        }];
      });
      
      // Create request with missing required parameter
      const invalidReq = {
        body: {
          tool: 'mcp__showIssue',
          args: {}
        }
      };
      const res = mockResponse();
      const next = jest.fn();
      
      // Validate request
      validateToolRequest(invalidReq, res, next);
      
      // Verify validation failed
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Missing required parameters')
        })
      );
    });
    
    it('should validate tool existence', () => {
      // Register tools first
      registerMcpTools();
      
      // Create request with non-existent tool
      const invalidReq = {
        body: {
          tool: 'non_existent_tool',
          args: {}
        }
      };
      const res = mockResponse();
      const next = jest.fn();
      
      // Validate request
      validateToolRequest(invalidReq, res, next);
      
      // Verify validation failed
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Tool not found'
        })
      );
    });
    
    it('should validate args format', () => {
      // Register tools first
      registerMcpTools();
      
      // Create request with invalid args format
      const invalidReq = {
        body: {
          tool: 'mcp__listIssues',
          args: 'not an object'
        }
      };
      const res = mockResponse();
      const next = jest.fn();
      
      // Validate request
      validateToolRequest(invalidReq, res, next);
      
      // Verify validation failed
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('args')
        })
      );
    });
    
    it('should pass validation for valid request', () => {
      // Register tools first
      registerMcpTools();
      
      // Create valid request
      const validReq = {
        body: {
          tool: 'mcp__listIssues',
          args: { state: 'open' }
        }
      };
      const res = mockResponse();
      const next = jest.fn();
      
      // Validate request
      validateToolRequest(validReq, res, next);
      
      // Verify validation passed
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('executeToolRequest', () => {
    // Setup mocks
    const mockSuccessResult = {
      success: true,
      data: { some: 'data' }
    };
    
    beforeEach(() => {
      // Reset mocks
      jest.resetAllMocks();
      
      // Register tools
      registerMcpTools();
    });
    
    it('should execute the requested tool and return results', async () => {
      // Mock one of the tool functions to return success
      mcp__listIssues.mockResolvedValueOnce(mockSuccessResult);
      
      // Create request with resolved tool
      const req = {
        body: {
          tool: 'mcp__listIssues',
          args: { state: 'open' }
        },
        resolvedTool: {
          name: 'mcp__listIssues',
          implementation: mcp__listIssues,
          description: 'List all issues',
          parameters: []
        }
      };
      const res = mockResponse();
      
      // Execute request
      await executeToolRequest(req, res);
      
      // Verify tool was called
      expect(mcp__listIssues).toHaveBeenCalledWith({ state: 'open' });
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSuccessResult);
    });
    
    it('should handle tool execution errors', async () => {
      // Mock tool to throw error
      const errorMessage = 'Tool execution failed';
      mcp__showIssue.mockRejectedValueOnce(new Error(errorMessage));
      
      // Create request with resolved tool
      const req = {
        body: {
          tool: 'mcp__showIssue',
          args: { issueNumber: '0001' }
        },
        resolvedTool: {
          name: 'mcp__showIssue',
          implementation: mcp__showIssue,
          description: 'Show issue details',
          parameters: []
        }
      };
      const res = mockResponse();
      
      // Execute request
      await executeToolRequest(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Tool execution failed',
          message: errorMessage
        })
      );
    });
    
    it('should return tool error responses directly', async () => {
      // Mock tool to return error response
      const errorResponse = {
        success: false,
        error: {
          type: 'ValidationError',
          message: 'Invalid parameter'
        }
      };
      mcp__addTask.mockResolvedValueOnce(errorResponse);
      
      // Create request with resolved tool
      const req = {
        body: {
          tool: 'mcp__addTask',
          args: { issueNumber: '0001' }
        },
        resolvedTool: {
          name: 'mcp__addTask',
          implementation: mcp__addTask,
          description: 'Add a task to an issue',
          parameters: []
        }
      };
      const res = mockResponse();
      
      // Execute request
      await executeToolRequest(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(errorResponse);
    });
    
    it('should handle requests for tools that do not exist', async () => {
      // Create request with non-existent tool
      const req = {
        body: {
          tool: 'non_existent_tool',
          args: {}
        }
      };
      const res = mockResponse();
      
      // Execute request
      await executeToolRequest(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Tool not found'
        })
      );
    });
  });
});