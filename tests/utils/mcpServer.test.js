// ABOUTME: Tests for the MCP server utility functions and server setup
// ABOUTME: Verifies server initialization, middleware registration, and shutdown handling

const { 
  createServer, 
  configureMiddleware, 
  registerTools, 
  startServer, 
  stopServer,
  authMiddleware
} = require('../../src/utils/mcpServer');

// Mock Express
const mockUse = jest.fn().mockReturnThis();
const mockGet = jest.fn().mockReturnThis();
const mockPost = jest.fn().mockReturnThis();
const mockListen = jest.fn();

const mockApp = {
  use: mockUse,
  get: mockGet,
  post: mockPost,
  listen: mockListen
};

const mockRouter = {
  get: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis()
};

jest.mock('express', () => {
  const express = jest.fn(() => mockApp);
  express.json = jest.fn(() => 'json-middleware');
  express.urlencoded = jest.fn(() => 'urlencoded-middleware');
  express.Router = jest.fn(() => mockRouter);
  
  return express;
});

// Mock HTTP server
const mockServerInstance = {
  listen: jest.fn((port, host, cb) => {
    if (cb) cb();
    return mockServerInstance;
  }),
  on: jest.fn(),
  address: jest.fn(() => ({ port: 3000, address: 'localhost' })),
  close: jest.fn(callback => callback && callback())
};

jest.mock('http', () => ({
  createServer: jest.fn(() => mockServerInstance)
}));

// Mock endpoints setup
jest.mock('../../src/utils/mcpEndpoints', () => ({
  setupHealthCheck: jest.fn(),
  setupApiRoutes: jest.fn(),
  validateToolRequest: jest.fn()
}));

describe('MCP Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createServer', () => {
    it('should create an Express application', () => {
      createServer();
      const express = require('express');
      expect(express).toHaveBeenCalled();
    });

    it('should configure middleware for the app', () => {
      createServer();
      expect(mockUse).toHaveBeenCalled();
    });

    it('should create routes for the API', () => {
      createServer();
      const { setupHealthCheck, setupApiRoutes } = require('../../src/utils/mcpEndpoints');
      expect(setupHealthCheck).toHaveBeenCalled();
      expect(setupApiRoutes).toHaveBeenCalled();
    });

    it('should return the configured app', () => {
      const result = createServer();
      expect(result).toBe(mockApp);
    });
  });

  describe('configureMiddleware', () => {
    it('should add JSON middleware', () => {
      configureMiddleware(mockApp);
      const express = require('express');
      expect(express.json).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalledWith('json-middleware');
    });

    it('should add URL-encoded middleware', () => {
      configureMiddleware(mockApp);
      const express = require('express');
      expect(express.urlencoded).toHaveBeenCalledWith(expect.objectContaining({
        extended: true
      }));
      expect(mockApp.use).toHaveBeenCalledWith('urlencoded-middleware');
    });

    it('should configure CORS if enabled', () => {
      configureMiddleware(mockApp, { enableCors: true });
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should add error handling middleware', () => {
      configureMiddleware(mockApp);
      // The last middleware should be the error handler
      const lastCall = mockApp.use.mock.calls[mockApp.use.mock.calls.length - 1];
      expect(lastCall[0]).toBeInstanceOf(Function);
    });
  });
  describe('authentication middleware', () => {
    it('should allow requests with valid token', () => {
      const mockReq = { 
        headers: { authorization: 'Bearer valid-token' },
        query: {},
        path: '/test'
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      authMiddleware('valid-token')(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token', () => {
      const mockReq = { 
        headers: { authorization: 'Bearer invalid-token' },
        query: {},
        path: '/test'
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      authMiddleware('valid-token')(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject requests with missing token', () => {
      const mockReq = { 
        headers: { },
        query: {},
        path: '/test'
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      authMiddleware('valid-token')(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should allow access to health check without token', () => {
      const mockReq = { 
        headers: { },
        query: {},
        path: '/health'
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      authMiddleware('valid-token')(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should accept token in query string', () => {
      const mockReq = { 
        headers: { },
        query: { token: 'valid-token' },
        path: '/test'
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      authMiddleware('valid-token')(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
  describe('registerTools', () => {
    beforeEach(() => {
      // Mock CLI functions
      jest.mock('../../src/cli', () => ({
        loadAvailableCommands: jest.fn().mockReturnValue([
          {
            createCommand: jest.fn().mockReturnValue({
              name: jest.fn().mockReturnValue('list'),
              description: jest.fn().mockReturnValue('List all issues'),
              hidden: false,
              options: [
                { 
                  flags: '-j, --json', 
                  description: 'Output as JSON',
                  defaultValue: false
                }
              ]
            })
          },
          {
            createCommand: jest.fn().mockReturnValue({
              name: jest.fn().mockReturnValue('show'),
              description: jest.fn().mockReturnValue('Show issue details'),
              hidden: false,
              options: [
                { 
                  flags: '-n, --number <number>', 
                  description: 'Issue number',
                  required: true
                }
              ]
            })
          }
        ])
      }));
    });

    it('should register available tools', () => {
      const tools = registerTools(mockRouter);
      
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('list');
      expect(tools[1].name).toBe('show');
    });
    
    it('should extract tool parameters from command options', () => {
      const tools = registerTools(mockRouter);
      
      expect(tools[0].parameters).toHaveLength(1);
      expect(tools[0].parameters[0].name).toBe('json');
      
      expect(tools[1].parameters).toHaveLength(1);
      expect(tools[1].parameters[0].name).toBe('number');
      expect(tools[1].parameters[0].required).toBe(true);
    });
    
    it('should skip commands marked as hidden', () => {
      const cli = require('../../src/cli');
      cli.loadAvailableCommands.mockReturnValueOnce([
        {
          createCommand: jest.fn().mockReturnValue({
            name: jest.fn().mockReturnValue('hidden-command'),
            description: jest.fn().mockReturnValue('Should not be registered'),
            hidden: true,
            options: []
          })
        }
      ]);
      
      const tools = registerTools(mockRouter);
      expect(tools).toHaveLength(0);
    });
  });

  describe('startServer', () => {
    it('should create an HTTP server', () => {
      startServer({ port: 3000, host: 'localhost' });
      
      const http = require('http');
      expect(http.createServer).toHaveBeenCalled();
    });

    it('should listen on the specified port and host', () => {
      startServer({ port: 8080, host: '127.0.0.1' });
      
      expect(mockServerInstance.listen).toHaveBeenCalledWith(
        8080, '127.0.0.1', expect.any(Function)
      );
    });

    it('should handle server errors', () => {
      startServer({ port: 3000 });
      
      expect(mockServerInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should return the server instance', () => {
      const result = startServer({ port: 3000 });
      
      expect(result).toBe(mockServerInstance);
    });
  });
  describe('stopServer', () => {
    it('should close the server gracefully', () => {
      stopServer(mockServerInstance);
      
      expect(mockServerInstance.close).toHaveBeenCalled();
    });

    it('should handle errors during shutdown', async () => {
      const mockErrorServer = {
        close: jest.fn((cb) => cb(new Error('Shutdown error'))),
        on: jest.fn().mockReturnThis()
      };
      
      // The updated stopServer now resolves even for errors
      await stopServer(mockErrorServer);
      expect(mockErrorServer.close).toHaveBeenCalled();
      expect(mockErrorServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should resolve when server is closed successfully', () => {
      const promise = stopServer(mockServerInstance);
      
      return expect(promise).resolves.toBeUndefined();
    });
  });
});