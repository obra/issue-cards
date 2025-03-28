// ABOUTME: Tests for the MCP server API endpoints and health check route
// ABOUTME: Verifies API routes, request validation, and response formats

const { 
  setupHealthCheck, 
  setupApiRoutes, 
  validateToolRequest,
  toolExecutionHandler,
  statusHandler
} = require('../../src/utils/mcpEndpoints');

// Mock Command execution
jest.mock('../../src/index', () => ({
  executeCommand: jest.fn().mockResolvedValue({
    success: true,
    data: { result: 'command executed' }
  })
}));

// Mock package.json
jest.mock('../../package.json', () => ({
  version: '1.0.0'
}));

// Mock Express Router
const mockGet = jest.fn().mockReturnThis();
const mockPost = jest.fn().mockReturnThis();
const mockUse = jest.fn().mockReturnThis();

const mockRouter = {
  get: mockGet,
  post: mockPost,
  use: mockUse
};

// Mock response object
const mockStatus = jest.fn().mockReturnThis();
const mockJson = jest.fn().mockReturnThis();
const mockSend = jest.fn().mockReturnThis();

const mockRes = {
  status: mockStatus,
  json: mockJson,
  send: mockSend
};

// Mock request object
const mockReq = {
  body: {},
  params: {},
  query: {}
};

// Mock next function
const mockNext = jest.fn();

describe('MCP Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupHealthCheck', () => {
    it('should register a GET route for health check', () => {
      setupHealthCheck(mockRouter);
      expect(mockRouter.get).toHaveBeenCalledWith('/health', expect.any(Function));
    });

    it('should return a 200 status when the server is healthy', () => {
      setupHealthCheck(mockRouter);
      
      // Get the health check handler
      const healthHandler = mockRouter.get.mock.calls[0][1];
      
      // Call the handler with mock request and response
      healthHandler(mockReq, mockRes);
      
      // Verify it returns 200 status and correct response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ok'
      }));
    });
  });

  describe('setupApiRoutes', () => {
    beforeEach(() => {
      // Mock registerTools from mcpServer
      jest.mock('../../src/utils/mcpServer', () => ({
        registerTools: jest.fn().mockReturnValue([
          { name: 'list', description: 'List issues', parameters: [] },
          { name: 'show', description: 'Show issue', parameters: [] }
        ])
      }));
    });

    it('should register routes for all API endpoints', () => {
      setupApiRoutes(mockRouter);
      expect(mockRouter.post).toHaveBeenCalled();
      expect(mockRouter.get).toHaveBeenCalled();
    });

    it('should register the tool execution route with middleware', () => {
      setupApiRoutes(mockRouter);
      expect(mockRouter.post).toHaveBeenCalledWith('/tools/execute', validateToolRequest, toolExecutionHandler);
    });

    it('should register the status route', () => {
      setupApiRoutes(mockRouter);
      expect(mockRouter.get).toHaveBeenCalledWith('/status', statusHandler);
    });
    
    it('should register tool listing endpoint', () => {
      setupApiRoutes(mockRouter);
      expect(mockRouter.get).toHaveBeenCalledWith('/tools', expect.any(Function));
    });
    
    it('should register individual tool details endpoint', () => {
      setupApiRoutes(mockRouter);
      expect(mockRouter.get).toHaveBeenCalledWith('/tools/:name', expect.any(Function));
    });
    
    it('should register tools from mcpServer', () => {
      const { registerTools } = require('../../src/utils/mcpServer');
      setupApiRoutes(mockRouter);
      expect(registerTools).toHaveBeenCalledWith(mockRouter);
    });
  });

  describe('validateToolRequest', () => {
    beforeEach(() => {
      // Set available tools in the module scope for testing
      const module = require('../../src/utils/mcpEndpoints');
      Object.defineProperty(module, 'availableTools', {
        value: [
          { name: 'list', description: 'List issues' },
          { name: 'show', description: 'Show issue' }
        ],
        writable: true
      });
    });
    
    it('should validate that the request body contains a tool name', () => {
      const mockRequest = {
        body: {
          // Missing tool name
          args: {}
        }
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNextFn = jest.fn();
      
      validateToolRequest(mockRequest, mockResponse, mockNextFn);
      
      expect(mockNextFn).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('tool')
      }));
    });

    it('should validate that the request body contains valid arguments', () => {
      const mockRequest = {
        body: {
          tool: 'list',
          // Missing arguments
        }
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNextFn = jest.fn();
      
      validateToolRequest(mockRequest, mockResponse, mockNextFn);
      
      expect(mockNextFn).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('args')
      }));
    });
    
    it('should validate that the requested tool exists', () => {
      const mockRequest = {
        body: {
          tool: 'nonexistent-tool',
          args: {}
        }
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNextFn = jest.fn();
      
      validateToolRequest(mockRequest, mockResponse, mockNextFn);
      
      expect(mockNextFn).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Tool not found'
      }));
    });

    it('should call next() for valid requests with existing tools', () => {
      const mockRequest = {
        body: {
          tool: 'list',
          args: {}
        }
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNextFn = jest.fn();
      
      validateToolRequest(mockRequest, mockResponse, mockNextFn);
      
      expect(mockNextFn).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('toolExecutionHandler', () => {
    it('should execute the requested tool with the provided arguments', () => {
      const mockRequest = {
        body: {
          tool: 'list',
          args: { json: true }
        }
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Mock the execution function
      const { executeCommand } = require('../../src/index');
      
      toolExecutionHandler(mockRequest, mockResponse);
      
      expect(executeCommand).toHaveBeenCalledWith('list', { json: true });
    });

    it('should handle successful tool execution', () => {
      const mockRequest = {
        body: {
          tool: 'list',
          args: {}
        }
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Mock the execution function to return success
      const { executeCommand } = require('../../src/index');
      executeCommand.mockResolvedValue({
        success: true,
        data: { result: 'command executed' }
      });
      
      return toolExecutionHandler(mockRequest, mockResponse).then(() => {
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.any(Object)
        }));
      });
    });

    it('should handle errors during tool execution', () => {
      const mockRequest = {
        body: {
          tool: 'list',
          args: {}
        }
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Mock the execution function to return an error
      const { executeCommand } = require('../../src/index');
      executeCommand.mockRejectedValue(new Error('Execution error'));
      
      return toolExecutionHandler(mockRequest, mockResponse).then(() => {
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Tool execution failed',
          message: 'Execution error'
        });
      });
    });

    it('should return the tool execution results', () => {
      const mockRequest = {
        body: {
          tool: 'list',
          args: {}
        }
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Mock the execution function with specific result
      const { executeCommand } = require('../../src/index');
      const mockResult = {
        success: true,
        data: { issues: [{ number: '0001', title: 'Test issue' }] }
      };
      executeCommand.mockResolvedValue(mockResult);
      
      return toolExecutionHandler(mockRequest, mockResponse).then(() => {
        expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      });
    });
  });

  describe('statusHandler', () => {
    it('should return server status information', () => {
      statusHandler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'running'
      }));
    });

    it('should include version information', () => {
      statusHandler(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        version: expect.any(String)
      }));
    });

    it('should include available tools', () => {
      statusHandler(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        tools: expect.any(Array)
      }));
      
      // Get the tools array from the mock call
      const response = mockRes.json.mock.calls[0][0];
      expect(response.tools.length).toBeGreaterThan(0);
    });
  });
});