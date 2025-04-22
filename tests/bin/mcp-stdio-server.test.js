// ABOUTME: Tests for MCP stdio server binary entrypoint
// ABOUTME: Validates the standalone binary for stdio MCP server

const mockIsInitialized = jest.fn();
const mockStartStdioServer = jest.fn();

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: mockIsInitialized
}));

jest.mock('../../src/mcp/stdioServer', () => ({
  startStdioServer: mockStartStdioServer
}));

// Mock process.exit and process.argv
const originalExit = process.exit;
const originalArgv = process.argv;
const originalOn = process.on;
const originalStderrWrite = process.stderr.write;

describe('mcp-stdio-server binary', () => {
  let stderrOutput = [];
  
  beforeEach(() => {
    // Reset mocks
    mockIsInitialized.mockReset();
    mockStartStdioServer.mockReset();
    
    // Mock process functions
    process.exit = jest.fn();
    process.argv = ['node', 'mcp-stdio-server.js'];
    process.on = jest.fn();
    
    // Mock stderr
    stderrOutput = [];
    process.stderr.write = jest.fn((...args) => {
      stderrOutput.push(args[0]);
      return true;
    });
    
    // Clear module cache to force reloading
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore original functions
    process.exit = originalExit;
    process.argv = originalArgv;
    process.on = originalOn;
    process.stderr.write = originalStderrWrite;
  });
  
  test('should check if issue tracking is initialized', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    // Load the script
    require('../../bin/mcp-stdio-server');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    expect(mockIsInitialized).toHaveBeenCalled();
  });
  
  test('should exit with error if not initialized', async () => {
    mockIsInitialized.mockResolvedValue(false);
    
    // Load the script
    require('../../bin/mcp-stdio-server');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    expect(process.stderr.write).toHaveBeenCalled();
    expect(stderrOutput.join('')).toContain('Issue tracking is not initialized');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('should start stdio server with default options', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    // Load the script
    require('../../bin/mcp-stdio-server');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    expect(mockStartStdioServer).toHaveBeenCalledWith(expect.objectContaining({
      debug: false
    }));
  });
  
  test('should enable debug mode with --debug flag', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    // Set debug flag
    process.argv = ['node', 'mcp-stdio-server.js', '--debug'];
    
    // Load the script
    require('../../bin/mcp-stdio-server');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    expect(mockStartStdioServer).toHaveBeenCalledWith(expect.objectContaining({
      debug: true
    }));
  });
  
  test('should output debug information when debug is enabled', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    // Set debug flag
    process.argv = ['node', 'mcp-stdio-server.js', '--debug'];
    
    // Load the script
    require('../../bin/mcp-stdio-server');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    expect(process.stderr.write).toHaveBeenCalled();
    expect(stderrOutput.join('')).toContain('Starting MCP stdio server');
    expect(stderrOutput.join('')).toContain('Debug mode: enabled');
  });
  
  test('should set up error handlers', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    // Load the script
    require('../../bin/mcp-stdio-server');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Check that error handlers were registered
    expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
  });
  
  test('should handle uncaught exceptions', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    // Load the script
    require('../../bin/mcp-stdio-server');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Get the uncaughtException handler
    const uncaughtHandler = process.on.mock.calls.find(call => call[0] === 'uncaughtException')[1];
    
    // Call the handler with an error
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at test.js:1:1';
    uncaughtHandler(error);
    
    expect(process.stderr.write).toHaveBeenCalled();
    expect(stderrOutput.join('')).toContain('Uncaught exception: Test error');
    expect(stderrOutput.join('')).toContain('Error: Test error\n    at test.js:1:1');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('should handle unhandled rejections', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    // Load the script
    require('../../bin/mcp-stdio-server');
    
    // Wait for promises to resolve
    await new Promise(process.nextTick);
    
    // Get the unhandledRejection handler
    const rejectionHandler = process.on.mock.calls.find(call => call[0] === 'unhandledRejection')[1];
    
    // Call the handler with a reason
    const reason = new Error('Test rejection');
    reason.stack = 'Error: Test rejection\n    at test.js:1:1';
    rejectionHandler(reason, {});
    
    expect(process.stderr.write).toHaveBeenCalled();
    expect(stderrOutput.join('')).toContain('Unhandled rejection: Error: Test rejection');
    expect(stderrOutput.join('')).toContain('Error: Test rejection\n    at test.js:1:1');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});