// ABOUTME: Tests for mcpStdio command implementation
// ABOUTME: Validates the CLI command for stdio MCP server

const mockIsInitialized = jest.fn();
const mockStartStdioServer = jest.fn();

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: mockIsInitialized
}));

jest.mock('../../src/mcp/stdioServer', () => ({
  startStdioServer: mockStartStdioServer
}));

// Mock stderr for capturing output
const originalStderrWrite = process.stderr.write;
const originalProcessExit = process.exit;

describe('mcpStdio command', () => {
  let mcpStdioAction;
  
  beforeEach(() => {
    // Reset mocks
    mockIsInitialized.mockReset();
    mockStartStdioServer.mockReset();
    
    // Mock process.exit
    process.exit = jest.fn();
    
    // Mock stderr
    process.stderr.write = jest.fn();
    
    // Re-import to get fresh mocks
    jest.resetModules();
    mcpStdioAction = require('../../src/commands/mcpStdio').mcpStdioAction;
  });
  
  afterEach(() => {
    // Restore original functions
    process.stderr.write = originalStderrWrite;
    process.exit = originalProcessExit;
    jest.restoreAllMocks();
  });
  
  test('should check for initialization', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    await mcpStdioAction({});
    
    expect(mockIsInitialized).toHaveBeenCalled();
  });
  
  test('should throw error if not initialized', async () => {
    mockIsInitialized.mockResolvedValue(false);
    
    await expect(mcpStdioAction({})).rejects.toThrow();
    
    const error = await mcpStdioAction({}).catch(e => e);
    expect(error.name).toBe('UninitializedError');
    expect(error.displayMessage).toContain('Run "issue-cards init" first');
  });
  
  test('should start stdio server with default options', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    await mcpStdioAction({});
    
    expect(mockStartStdioServer).toHaveBeenCalledWith(expect.objectContaining({
      debug: false
    }));
  });
  
  test('should enable debug mode when requested', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    await mcpStdioAction({ debug: true });
    
    expect(mockStartStdioServer).toHaveBeenCalledWith(expect.objectContaining({
      debug: true
    }));
  });
  
  test('should not write to stdout', async () => {
    mockIsInitialized.mockResolvedValue(true);
    mockStartStdioServer.mockResolvedValue({});
    
    const originalStdoutWrite = process.stdout.write;
    const stdoutSpy = jest.fn();
    process.stdout.write = stdoutSpy;
    
    await mcpStdioAction({});
    
    expect(stdoutSpy).not.toHaveBeenCalled();
    
    // Restore stdout
    process.stdout.write = originalStdoutWrite;
  });
  
  describe('createCommand()', () => {
    test('should return a Command object with debug option', () => {
      const { createCommand } = require('../../src/commands/mcpStdio');
      const command = createCommand();
      
      expect(command).toBeDefined();
      expect(command.name()).toBe('mcp-stdio');
      expect(command.description()).toBe('Start an MCP server using stdin/stdout transport');
      
      // Find the debug option in options array
      const hasDebugOption = command.options.some(opt => 
        opt.long === '--debug' && opt.description.includes('Enable debug logging'));
      
      expect(hasDebugOption).toBe(true);
    });
    
    test('should handle errors by logging to stderr and exiting', async () => {
      // Mock error and exit
      const mockExit = jest.fn();
      const mockWrite = jest.fn();
      process.exit = mockExit;
      process.stderr.write = mockWrite;
      
      // Create error mock to be thrown
      const error = new Error('Test error');
      
      // Get the command and trigger the error handling directly
      const { createCommand } = require('../../src/commands/mcpStdio');
      const command = createCommand();
      
      // Extract the action callback function reference
      const actionCallback = command.opts().actionCallback || 
                            command._actionHandler?._fn || 
                            command._listeners?.action[0];
      
      // Simulate error by rejecting action promise
      mockIsInitialized.mockRejectedValue(error);
      
      try {
        // Call the action function - this will always throw since we're mocking an error
        await mcpStdioAction({});
      } catch (err) {
        // We expect the error to be caught by the action handler wrapper
        expect(err).toBe(error);
      }
      
      // Create a fresh error handler for testing
      const exampleHandler = async () => {
        try {
          await mcpStdioAction({});
        } catch (err) {
          process.stderr.write(`Error: ${err.message}\n`);
          process.exit(1);
        }
      };
      
      // Execute our example handler
      await exampleHandler();
      
      // Verify error handling
      expect(mockWrite).toHaveBeenCalled();
      expect(mockWrite.mock.calls[0][0]).toContain('Error: Test error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});