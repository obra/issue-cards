// ABOUTME: Tests for MCP protocol compliance methods
// ABOUTME: Validates methods required for MCP specification compliance

const { PassThrough } = require('stream');
const mockTools = require('../utils/testHelpers').mockMcpTools;

// Mock dependencies
const mockGetRegisteredTools = jest.fn().mockReturnValue(mockTools);
jest.mock('../../src/mcp/registration', () => ({
  getRegisteredTools: mockGetRegisteredTools
}));

// Path is mocked to load a specific package.json version
jest.mock('../../package.json', () => ({
  version: '1.0.0-test'
}), { virtual: true });

// Import after mocks are set up
const StdioTransport = require('../../src/mcp/stdioTransport');

describe('MCP Protocol Compliance', () => {
  let transport;
  let mockStdin;
  let mockStdout;
  let mockStderr;
  let onLineCallback;
  
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
    
    // Mock readline interface
    transport.readline = {
      on: jest.fn((event, callback) => {
        if (event === 'line') onLineCallback = callback;
      }),
      close: jest.fn()
    };
    
    // Initialize with tools
    transport.tools = mockTools;
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('should handle initialize request with protocol version negotiation', async () => {
    transport.sendResponse = jest.fn();
    
    const request = {
      jsonrpc: '2.0',
      id: 'init',
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'TestClient',
          version: '1.0.0'
        }
      }
    };
    
    await transport.handleRequest(request);
    
    expect(transport.sendResponse).toHaveBeenCalledWith('init', expect.objectContaining({
      protocolVersion: '2025-03-26',
      capabilities: expect.objectContaining({
        tools: expect.any(Object)
      }),
      serverInfo: expect.objectContaining({
        name: 'issue-cards-mcp',
        version: expect.any(String)
      })
    }));
    
    // Check that client capabilities were stored
    expect(transport.clientCapabilities).toBeDefined();
  });
  
  test('should handle initialized notification', async () => {
    const notification = {
      jsonrpc: '2.0',
      method: 'initialized',
      params: {}
    };
    
    await transport.handleNotification(notification);
    
    expect(transport.initialized).toBe(true);
    expect(mockStderr.write).toHaveBeenCalled();
    expect(mockStderr.write.mock.calls.some(call => call[0].includes('Client initialized'))).toBe(true);
  });
  
  test('should handle tools/list request', async () => {
    transport.sendResponse = jest.fn();
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };
    
    await transport.handleRequest(request);
    
    expect(transport.sendResponse).toHaveBeenCalledWith(1, expect.objectContaining({
      tools: expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          description: expect.any(String),
          schema: expect.any(Object)
        })
      ])
    }));
  });
  
  test('should handle tools/call request', async () => {
    transport.handleToolExecution = jest.fn();
    
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'mcp__testTool',
        arguments: { arg1: 'value1' }
      }
    };
    
    await transport.handleRequest(request);
    
    expect(transport.handleToolExecution).toHaveBeenCalledWith(2, {
      tool: 'mcp__testTool',
      args: { arg1: 'value1' }
    });
  });
  
  test('should handle client/exit notification', async () => {
    transport.stop = jest.fn();
    
    const notification = {
      jsonrpc: '2.0',
      method: 'client/exit'
    };
    
    await transport.handleNotification(notification);
    
    expect(transport.stop).toHaveBeenCalled();
  });
  
  test('should handle batch requests', async () => {
    // Create a spy for the processBatchMessages method
    const processBatchSpy = jest.spyOn(transport, 'processBatchMessages');
    
    // Create batch of requests
    const batch = [
      { jsonrpc: '2.0', id: 1, method: 'server/info' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' }
    ];
    
    // Call handleLine with a batch
    transport.handleLine(JSON.stringify(batch));
    
    expect(processBatchSpy).toHaveBeenCalledWith(batch);
  });
  
  test('should process empty batch correctly', async () => {
    transport.sendMessage = jest.fn();
    
    await transport.processBatchMessages([]);
    
    expect(transport.sendMessage).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid Request',
        data: expect.any(Object)
      },
      id: null
    });
  });
  
  test('should process non-empty batch correctly', async () => {
    // Create mocks for the methods that will be called
    transport.processMessage = jest.fn();
    transport.sendMessage = jest.fn();
    
    // Create batch with a notification and a request
    const batch = [
      { jsonrpc: '2.0', method: 'initialized', params: {} }, // notification
      { jsonrpc: '2.0', id: 1, method: 'server/info' }      // request
    ];
    
    // Setup mock behavior for processMessage
    transport.processMessage.mockImplementation(async (message) => {
      if (message.id === 1) {
        // Simulate sending a response for the request
        const response = {
          jsonrpc: '2.0',
          id: 1,
          result: { name: 'test' }
        };
        transport.sendMessage(response);
        return response;
      }
      return null; // No response for notification
    });
    
    // Process the batch
    await transport.processBatchMessages(batch);
    
    // We expect processMessage to be called once for each message in the batch
    expect(transport.processMessage).toHaveBeenCalledTimes(2);
    
    // Verify the messages were processed in the correct order
    expect(transport.processMessage).toHaveBeenNthCalledWith(1, batch[0]);
    expect(transport.processMessage).toHaveBeenNthCalledWith(2, batch[1]);
  });
  
  test('should handle shutdown request', async () => {
    transport.sendResponse = jest.fn();
    
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'shutdown'
    };
    
    await transport.handleRequest(request);
    
    expect(transport.shutdownRequested).toBe(true);
    expect(transport.sendResponse).toHaveBeenCalledWith(3, null);
  });
  
  test('should handle $/cancelRequest notification', async () => {
    const notification = {
      jsonrpc: '2.0',
      method: '$/cancelRequest',
      params: {
        id: 123
      }
    };
    
    await transport.handleNotification(notification);
    
    expect(mockStderr.write).toHaveBeenCalled();
    expect(mockStderr.write.mock.calls.some(call => 
      call[0].includes('Request cancellation received for id: 123')
    )).toBe(true);
  });
});