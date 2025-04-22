// ABOUTME: Tests for MCP stdio server implementation
// ABOUTME: Validates the standalone stdio server for MCP tools

const mockRegisterMcpTools = jest.fn();
const mockStdioTransport = jest.fn();
const mockTransportInstance = {
  start: jest.fn().mockResolvedValue(),
  stop: jest.fn().mockResolvedValue(),
  onConnect: null,
  onDisconnect: null,
  logDebug: jest.fn()
};

// Mock dependencies
jest.mock('../../src/mcp/registration', () => ({
  registerMcpTools: mockRegisterMcpTools
}));

jest.mock('../../src/mcp/stdioTransport', () => {
  return function() {
    mockStdioTransport.apply(this, arguments);
    return mockTransportInstance;
  };
});

// Import after mocks are set up
const { startStdioServer } = require('../../src/mcp/stdioServer');

describe('stdioServer', () => {
  let originalProcessExit;
  let originalProcessOn;
  
  beforeEach(() => {
    // Mock process.exit and process.on
    originalProcessExit = process.exit;
    originalProcessOn = process.on;
    
    process.exit = jest.fn();
    process.on = jest.fn();
    
    // Reset mocks
    mockRegisterMcpTools.mockClear();
    mockStdioTransport.mockClear();
    mockTransportInstance.start.mockClear();
    mockTransportInstance.stop.mockClear();
    mockTransportInstance.logDebug.mockClear();
  });
  
  afterEach(() => {
    // Restore process functions
    process.exit = originalProcessExit;
    process.on = originalProcessOn;
  });
  
  test('should register MCP tools', async () => {
    await startStdioServer();
    
    expect(mockRegisterMcpTools).toHaveBeenCalled();
  });
  
  test('should create and start transport', async () => {
    await startStdioServer();
    
    expect(mockStdioTransport).toHaveBeenCalledWith(expect.objectContaining({
      debug: false
    }));
    expect(mockTransportInstance.start).toHaveBeenCalled();
  });
  
  test('should enable debug mode when requested', async () => {
    await startStdioServer({ debug: true });
    
    expect(mockStdioTransport).toHaveBeenCalledWith(expect.objectContaining({
      debug: true
    }));
  });
  
  test('should set up connect handler', async () => {
    await startStdioServer();
    
    expect(mockTransportInstance.onConnect).toBeDefined();
    
    // Call the connect handler
    mockTransportInstance.onConnect();
    
    expect(mockTransportInstance.logDebug).toHaveBeenCalledWith('MCP stdio server connected');
  });
  
  test('should set up disconnect handler', async () => {
    await startStdioServer();
    
    expect(mockTransportInstance.onDisconnect).toBeDefined();
    
    // Call the disconnect handler
    mockTransportInstance.onDisconnect();
    
    expect(mockTransportInstance.logDebug).toHaveBeenCalledWith('MCP stdio server disconnected');
    expect(process.exit).toHaveBeenCalledWith(0);
  });
  
  test('should set up SIGINT handler', async () => {
    await startStdioServer();
    
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    
    // Get and call the SIGINT handler
    const sigintHandler = process.on.mock.calls.find(call => call[0] === 'SIGINT')[1];
    await sigintHandler();
    
    expect(mockTransportInstance.logDebug).toHaveBeenCalledWith('Received SIGINT signal');
    expect(mockTransportInstance.stop).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });
  
  test('should set up SIGTERM handler', async () => {
    await startStdioServer();
    
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    
    // Get and call the SIGTERM handler
    const sigtermHandler = process.on.mock.calls.find(call => call[0] === 'SIGTERM')[1];
    await sigtermHandler();
    
    expect(mockTransportInstance.logDebug).toHaveBeenCalledWith('Received SIGTERM signal');
    expect(mockTransportInstance.stop).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });
  
  test('should return the transport instance', async () => {
    const result = await startStdioServer();
    
    expect(result).toBe(mockTransportInstance);
  });
});