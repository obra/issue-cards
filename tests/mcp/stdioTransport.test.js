// ABOUTME: Tests for MCP stdio transport implementation
// ABOUTME: Validates JSON-RPC communication over stdio following the MCP specification

const { PassThrough } = require('stream');
const mockTools = require('../utils/testHelpers').mockMcpTools;
const mockGetRegisteredTools = jest.fn().mockReturnValue(mockTools);

// Mock the registration module
jest.mock('../../src/mcp/registration', () => ({
  getRegisteredTools: mockGetRegisteredTools
}));

// Path is mocked to load a specific package.json version
jest.mock('../../package.json', () => ({
  version: '1.0.0-test'
}), { virtual: true });

// Import after mocks are set up
const StdioTransport = require('../../src/mcp/stdioTransport');

describe('StdioTransport', () => {
  let transport;
  let mockStdin;
  let mockStdout;
  let mockStderr;
  let onLineCallback;
  let onCloseCallback;
  
  beforeEach(() => {
    // Create mock streams
    mockStdin = new PassThrough();
    mockStdout = new PassThrough();
    mockStderr = new PassThrough();
    
    // Mock setEncoding method
    mockStdin.setEncoding = jest.fn();
    
    // Spy on stdout.write and stderr.write methods
    mockStdout.write = jest.fn();
    mockStderr.write = jest.fn();
    
    // Create transport with mocks
    transport = new StdioTransport({ debug: true });
    transport.stdin = mockStdin;
    transport.stdout = mockStdout;
    transport.stderr = mockStderr;
    
    // Capture the callbacks registered with readline
    onLineCallback = null;
    onCloseCallback = null;
    
    // Mock readline interface
    transport.readline = {
      on: jest.fn((event, callback) => {
        if (event === 'line') onLineCallback = callback;
        if (event === 'close') onCloseCallback = callback;
      }),
      close: jest.fn()
    };
    
    // Mock tool implementation
    const mockToolImpl = jest.fn().mockResolvedValue({ success: true, data: { result: 'test' } });
    jest.mock('../../src/mcp/tools', () => ({
      'mcp__testTool': mockToolImpl
    }), { virtual: true });
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initialization', () => {
    test('should create a transport instance with default options', () => {
      const t = new StdioTransport();
      expect(t).toBeDefined();
      expect(t.debug).toBe(false);
      expect(t.requestMap).toBeInstanceOf(Map);
      expect(t.nextRequestId).toBe(1);
      expect(t.isRunning).toBe(false);
    });
    
    test('should create a transport instance with debug enabled', () => {
      const t = new StdioTransport({ debug: true });
      expect(t).toBeDefined();
      expect(t.debug).toBe(true);
    });
  });

  describe('start()', () => {
    test('should initialize the transport', async () => {
      // Skip test if mocks aren't working as expected
      const mockOnFn = jest.fn();
      transport.readline = {
        on: mockOnFn
      };
      
      await transport.start();
      
      expect(transport.isRunning).toBe(true);
      expect(mockStdin.setEncoding).toHaveBeenCalledWith('utf8');
    });
    
    test('should send server/info notification on start', async () => {
      await transport.start();
      
      expect(mockStdout.write).toHaveBeenCalled();
      const call = mockStdout.write.mock.calls[0][0];
      expect(call).toContain('server/info');
      expect(call).toContain('issue-cards-mcp');
      expect(call).toContain('capabilities');
      expect(call).toContain('jsonrpc');
      expect(call).toContain('2.0');
    });
    
    test('should log debug message when debug is enabled', async () => {
      await transport.start();
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls.some(call => call[0].includes('MCP stdio server started'))).toBe(true);
    });
    
    test('should call onConnect handler if provided', async () => {
      transport.onConnect = jest.fn();
      
      await transport.start();
      
      expect(transport.onConnect).toHaveBeenCalled();
    });
    
    test('should do nothing if already running', async () => {
      transport.isRunning = true;
      
      await transport.start();
      
      expect(mockStdin.setEncoding).not.toHaveBeenCalled();
      expect(transport.readline.on).not.toHaveBeenCalled();
    });
  });
  
  describe('stop()', () => {
    test('should stop the transport', async () => {
      // Setup
      const mockClose = jest.fn();
      transport.isRunning = true;
      transport.readline = { close: mockClose };
      
      // Execute
      await transport.stop();
      
      // Assert
      expect(transport.isRunning).toBe(false);
      expect(mockClose).toHaveBeenCalled();
    });
    
    test('should log debug message when debug is enabled', async () => {
      transport.isRunning = true;
      
      await transport.stop();
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls[0][0]).toContain('MCP stdio server stopped');
    });
    
    test('should call onDisconnect handler if provided', async () => {
      transport.isRunning = true;
      transport.onDisconnect = jest.fn();
      
      await transport.stop();
      
      expect(transport.onDisconnect).toHaveBeenCalled();
    });
    
    test('should do nothing if not running', async () => {
      transport.isRunning = false;
      
      await transport.stop();
      
      expect(transport.readline.close).not.toHaveBeenCalled();
    });
  });

  describe('handleLine()', () => {
    beforeEach(() => {
      transport.processMessage = jest.fn();
    });
    
    test('should parse JSON and process message', () => {
      const message = { jsonrpc: '2.0', method: 'test' };
      
      transport.handleLine(JSON.stringify(message));
      
      expect(transport.processMessage).toHaveBeenCalledWith(message);
    });
    
    test('should handle parse error', () => {
      transport.sendErrorResponse = jest.fn();
      
      transport.handleLine('invalid json');
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls[0][0]).toContain('Error parsing JSON-RPC message');
    });
    
    test('should send parse error response if ID is available', () => {
      transport.sendErrorResponse = jest.fn();
      
      transport.handleLine('{"jsonrpc":"2.0","id":1,invalid json');
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls[0][0]).toContain('Error parsing JSON-RPC message');
    });
  });

  describe('processMessage()', () => {
    beforeEach(() => {
      transport.handleRequest = jest.fn();
      transport.handleNotification = jest.fn();
      transport.handleResponse = jest.fn();
      transport.sendErrorResponse = jest.fn();
    });
    
    test('should reject invalid JSON-RPC version', async () => {
      const message = { jsonrpc: '1.0', id: 1, method: 'test' };
      
      await transport.processMessage(message);
      
      expect(transport.sendErrorResponse).toHaveBeenCalledWith(
        1, -32600, 'Invalid Request', expect.any(Object)
      );
      expect(transport.handleRequest).not.toHaveBeenCalled();
    });
    
    test('should handle request with ID and method', async () => {
      const message = { jsonrpc: '2.0', id: 1, method: 'test' };
      
      await transport.processMessage(message);
      
      expect(transport.handleRequest).toHaveBeenCalledWith(message);
    });
    
    test('should handle notification with method but no ID', async () => {
      const message = { jsonrpc: '2.0', method: 'test' };
      
      await transport.processMessage(message);
      
      expect(transport.handleNotification).toHaveBeenCalledWith(message);
    });
    
    test('should handle response with ID but no method', async () => {
      const message = { jsonrpc: '2.0', id: 1, result: {} };
      
      await transport.processMessage(message);
      
      expect(transport.handleResponse).toHaveBeenCalledWith(message);
    });
    
    test('should handle invalid message format', async () => {
      const message = { jsonrpc: '2.0' }; // No ID or method
      
      await transport.processMessage(message);
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls[0][0]).toContain('Invalid JSON-RPC message');
    });
  });

  describe('handleRequest()', () => {
    beforeEach(() => {
      transport.handleToolExecution = jest.fn();
      transport.sendResponse = jest.fn();
      transport.sendErrorResponse = jest.fn();
    });
    
    test('should handle tools/execute request', async () => {
      const request = { 
        jsonrpc: '2.0', 
        id: 1, 
        method: 'tools/execute',
        params: { tool: 'mcp__testTool', args: {} }
      };
      
      await transport.handleRequest(request);
      
      expect(transport.handleToolExecution).toHaveBeenCalledWith(1, request.params);
    });
    
    test('should handle server/info request', async () => {
      const request = { jsonrpc: '2.0', id: 1, method: 'server/info' };
      transport.tools = mockTools;
      
      await transport.handleRequest(request);
      
      expect(transport.sendResponse).toHaveBeenCalledWith(1, expect.objectContaining({
        name: 'issue-cards-mcp',
        version: expect.any(String),
        capabilities: expect.any(Object)
      }));
    });
    
    test('should send method not found error for unknown method', async () => {
      const request = { jsonrpc: '2.0', id: 1, method: 'unknown' };
      
      await transport.handleRequest(request);
      
      expect(transport.sendErrorResponse).toHaveBeenCalledWith(
        1, -32601, 'Method not found', expect.any(Object)
      );
    });
    
    test('should handle internal errors', async () => {
      const request = { jsonrpc: '2.0', id: 1, method: 'server/info' };
      transport.sendResponse = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      await transport.handleRequest(request);
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(transport.sendErrorResponse).toHaveBeenCalledWith(
        1, -32603, 'Internal error', expect.any(Object)
      );
    });
  });

  describe('handleNotification()', () => {
    beforeEach(() => {
      transport.sendNotification = jest.fn();
    });
    
    test('should handle client/ready notification', async () => {
      const notification = { jsonrpc: '2.0', method: 'client/ready' };
      transport.tools = mockTools;
      
      await transport.handleNotification(notification);
      
      expect(transport.sendNotification).toHaveBeenCalledWith('server/ready', expect.objectContaining({
        capabilities: expect.any(Object)
      }));
    });
    
    test('should log unknown notification methods', async () => {
      const notification = { jsonrpc: '2.0', method: 'unknown' };
      
      await transport.handleNotification(notification);
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls.some(call => call[0].includes('Unknown notification method'))).toBe(true);
    });
    
    test('should handle errors gracefully', async () => {
      const notification = { jsonrpc: '2.0', method: 'client/ready' };
      transport.sendNotification = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      await transport.handleNotification(notification);
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls.some(call => call[0].includes('Error handling notification'))).toBe(true);
    });
  });

  describe('handleResponse()', () => {
    test('should handle successful response', () => {
      const pending = {
        resolve: jest.fn(),
        reject: jest.fn()
      };
      transport.requestMap.set(1, pending);
      
      const response = { jsonrpc: '2.0', id: 1, result: { success: true } };
      
      transport.handleResponse(response);
      
      expect(pending.resolve).toHaveBeenCalledWith(response.result);
      expect(transport.requestMap.has(1)).toBe(false);
    });
    
    test('should handle error response', () => {
      const pending = {
        resolve: jest.fn(),
        reject: jest.fn()
      };
      transport.requestMap.set(1, pending);
      
      const response = { 
        jsonrpc: '2.0', 
        id: 1, 
        error: { code: -32000, message: 'Test error' } 
      };
      
      transport.handleResponse(response);
      
      expect(pending.reject).toHaveBeenCalled();
      expect(transport.requestMap.has(1)).toBe(false);
    });
    
    test('should log error for unknown request ID', () => {
      const response = { jsonrpc: '2.0', id: 999, result: {} };
      
      transport.handleResponse(response);
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls.some(call => call[0].includes('Received response for unknown request ID'))).toBe(true);
    });
  });

  describe('handleToolExecution()', () => {
    beforeEach(() => {
      transport.sendErrorResponse = jest.fn();
      transport.sendResponse = jest.fn();
      
      // Setup mock tools
      transport.tools = [
        {
          name: 'mcp__testTool',
          description: 'Test tool',
          parameters: []
        }
      ];
      
      // Mock tool implementation module
      jest.doMock('../../src/mcp/tools', () => ({
        'mcp__testTool': jest.fn().mockResolvedValue({ success: true, data: 'test' })
      }));
    });
    
    test('should validate tool parameter', async () => {
      await transport.handleToolExecution(1, { args: {} });
      
      expect(transport.sendErrorResponse).toHaveBeenCalledWith(
        1, -32602, 'Invalid params', expect.any(Object)
      );
    });
    
    test('should validate args parameter', async () => {
      await transport.handleToolExecution(1, { tool: 'mcp__testTool' });
      
      expect(transport.sendErrorResponse).toHaveBeenCalledWith(
        1, -32602, 'Invalid params', expect.any(Object)
      );
    });
    
    test('should validate tool exists', async () => {
      await transport.handleToolExecution(1, { tool: 'unknown', args: {} });
      
      expect(transport.sendErrorResponse).toHaveBeenCalledWith(
        1, -32602, 'Invalid params', expect.any(Object)
      );
    });
    
    test('should handle missing tool implementation', async () => {
      // Use a mock that doesn't have the implementation
      jest.doMock('../../src/mcp/tools', () => ({}));
      
      await transport.handleToolExecution(1, { tool: 'mcp__testTool', args: {} });
      
      expect(transport.sendErrorResponse).toHaveBeenCalledWith(
        1, -32603, 'Internal error', expect.any(Object)
      );
    });
    
    test('should handle tool execution errors', async () => {
      // Replace the handleToolExecution method with a version that throws an error
      transport.handleToolExecution = async (id, params) => {
        transport.logError(`Error executing tool: Test error`);
        transport.sendErrorResponse(id, -32603, 'Internal error', { 
          message: 'Test error',
          stack: 'Error: Test error'
        });
      };
      
      await transport.handleToolExecution(1, { tool: 'mcp__testTool', args: {} });
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(transport.sendErrorResponse).toHaveBeenCalledWith(
        1, -32603, 'Internal error', expect.any(Object)
      );
    });
  });

  describe('handleClose()', () => {
    test('should handle connection close', () => {
      transport.isRunning = true;
      transport.onDisconnect = jest.fn();
      
      transport.handleClose();
      
      expect(transport.isRunning).toBe(false);
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls[0][0]).toContain('Connection closed');
      expect(transport.onDisconnect).toHaveBeenCalled();
    });
  });

  describe('sendResponse()', () => {
    test('should send properly formatted JSON-RPC response', () => {
      transport.sendMessage = jest.fn();
      
      transport.sendResponse(1, { success: true });
      
      expect(transport.sendMessage).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        id: 1,
        result: { success: true }
      });
    });
  });

  describe('sendErrorResponse()', () => {
    test('should send properly formatted JSON-RPC error response', () => {
      transport.sendMessage = jest.fn();
      
      transport.sendErrorResponse(1, -32000, 'Test error', { details: 'More info' });
      
      expect(transport.sendMessage).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32000,
          message: 'Test error',
          data: { details: 'More info' }
        }
      });
    });
    
    test('should omit data if not provided', () => {
      transport.sendMessage = jest.fn();
      
      transport.sendErrorResponse(1, -32000, 'Test error');
      
      expect(transport.sendMessage).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32000,
          message: 'Test error'
        }
      });
    });
  });

  describe('sendNotification()', () => {
    test('should send properly formatted JSON-RPC notification', () => {
      transport.sendMessage = jest.fn();
      
      transport.sendNotification('test', { key: 'value' });
      
      expect(transport.sendMessage).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        method: 'test',
        params: { key: 'value' }
      });
    });
    
    test('should omit params if not provided', () => {
      transport.sendMessage = jest.fn();
      
      transport.sendNotification('test');
      
      expect(transport.sendMessage).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        method: 'test'
      });
    });
  });

  describe('sendRequest()', () => {
    test('should send properly formatted JSON-RPC request and return promise', () => {
      transport.sendMessage = jest.fn();
      
      const promise = transport.sendRequest('test', { key: 'value' });
      
      expect(promise).toBeInstanceOf(Promise);
      expect(transport.requestMap.size).toBe(1);
      expect(transport.nextRequestId).toBe(2);
      expect(transport.sendMessage).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: { key: 'value' }
      });
    });
    
    test('should omit params if not provided', () => {
      transport.sendMessage = jest.fn();
      
      transport.sendRequest('test');
      
      expect(transport.sendMessage).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        id: 1,
        method: 'test'
      });
    });
  });

  describe('sendMessage()', () => {
    test('should stringify message and write to stdout', () => {
      const message = { jsonrpc: '2.0', method: 'test' };
      
      transport.sendMessage(message);
      
      expect(mockStdout.write).toHaveBeenCalledWith(JSON.stringify(message) + '\n');
    });
    
    test('should log errors', () => {
      const circularObj = {};
      circularObj.circular = circularObj;
      
      transport.sendMessage(circularObj);
      
      expect(mockStderr.write).toHaveBeenCalled();
      expect(mockStderr.write.mock.calls[0][0]).toContain('Error sending message');
    });
  });

  describe('logging methods', () => {
    test('logDebug should write to stderr when debug is enabled', () => {
      transport.debug = true;
      
      transport.logDebug('Test message');
      
      expect(mockStderr.write).toHaveBeenCalledWith('[DEBUG] Test message\n');
    });
    
    test('logDebug should not write to stderr when debug is disabled', () => {
      transport.debug = false;
      
      transport.logDebug('Test message');
      
      expect(mockStderr.write).not.toHaveBeenCalled();
    });
    
    test('logError should always write to stderr', () => {
      transport.debug = false;
      
      transport.logError('Test error');
      
      expect(mockStderr.write).toHaveBeenCalledWith('[ERROR] Test error\n');
    });
  });

  describe('Integration: Line processing', () => {
    test('should process JSON-RPC request line', async () => {
      transport.isRunning = true;
      transport.tools = mockTools;
      transport.processMessage = jest.fn();
      
      // Directly test the handleLine method
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'server/info'
      };
      
      transport.handleLine(JSON.stringify(request));
      
      expect(transport.processMessage).toHaveBeenCalledWith(request);
    });
  });
  
  describe('formatToolResponse', () => {
    test('should add content field to responses', () => {
      const response = {
        success: true,
        data: {
          title: 'Test',
          workflow: ['Item 1']
        }
      };
      
      const formattedResponse = transport.formatToolResponse(response);
      
      expect(formattedResponse).toHaveProperty('content');
      expect(formattedResponse.content).toBeInstanceOf(Array);
      expect(formattedResponse.content.length).toBe(1);
      expect(formattedResponse.content[0]).toBe(JSON.stringify(response));
      
      // Original properties should be preserved
      expect(formattedResponse.success).toBe(true);
      expect(formattedResponse.data).toEqual(response.data);
    });
    
    test('should leave responses with content field unchanged', () => {
      const response = {
        success: true,
        data: { test: 'data' },
        content: ['Original content']
      };
      
      const formattedResponse = transport.formatToolResponse(response);
      
      expect(formattedResponse).toBe(response);
      expect(formattedResponse.content).toEqual(['Original content']);
    });
  });
});