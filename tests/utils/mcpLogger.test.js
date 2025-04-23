// ABOUTME: Tests for MCP Logger utility
// ABOUTME: Verifies logging of MCP requests and responses

const fs = require('fs');
const path = require('path');
const os = require('os');
const McpLogger = require('../../src/utils/mcpLogger');

// Mock fs module
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    createWriteStream: jest.fn().mockReturnValue({
      write: jest.fn(),
      end: jest.fn()
    })
  };
});

// Spy on console.error and disable it for tests
const originalConsoleError = console.error;
console.error = jest.fn();

describe('McpLogger', () => {
  // Restore console.error after tests
  afterAll(() => {
    console.error = originalConsoleError;
  });
  let logger;
  let customLogPath;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create temporary log path
    customLogPath = path.join(os.tmpdir(), `mcp-test-log-${Date.now()}.jsonl`);
    
    // Create logger instance
    logger = new McpLogger({ logPath: customLogPath });
  });
  
  afterEach(() => {
    // Close logger
    if (logger) {
      logger.close();
    }
  });
  
  it('should initialize with default options', () => {
    const defaultLogger = new McpLogger();
    expect(defaultLogger.enabled).toBe(true);
    expect(defaultLogger.logPath).toContain(os.tmpdir());
    expect(defaultLogger.logPath).toMatch(/issue-cards-mcp-.+\.jsonl$/);
  });
  
  it('should initialize with custom options', () => {
    expect(logger.enabled).toBe(true);
    expect(logger.logPath).toBe(customLogPath);
  });
  
  it('should create write stream on initialization', () => {
    expect(fs.createWriteStream).toHaveBeenCalledWith(customLogPath, { flags: 'a' });
    expect(logger.writeStream).toBeDefined();
  });
  
  it('should write header on initialization', () => {
    expect(logger.writeStream.write).toHaveBeenCalled();
    const firstCall = logger.writeStream.write.mock.calls[0][0];
    expect(firstCall).toContain('"type":"meta"');
    expect(firstCall).toContain('"timestamp"');
    expect(firstCall).toContain('"version"');
  });
  
  it('should log requests as JSONL', () => {
    const request = {
      jsonrpc: '2.0',
      method: 'tools/execute',
      params: { tool: 'mcp__test', args: { foo: 'bar' } },
      id: 1
    };
    
    logger.logRequest(request);
    
    const lastCall = logger.writeStream.write.mock.calls[1][0];
    expect(lastCall).toContain('"type":"request"');
    expect(lastCall).toContain('"timestamp"');
    expect(lastCall).toContain('"data"');
    expect(lastCall).toContain('"tool":"mcp__test"');
    expect(lastCall).toMatch(/\n$/); // Ends with newline
  });
  
  it('should log responses as JSONL', () => {
    const response = {
      jsonrpc: '2.0',
      result: { success: true, data: { result: 42 } },
      id: 1
    };
    
    logger.logResponse(response);
    
    const lastCall = logger.writeStream.write.mock.calls[1][0];
    expect(lastCall).toContain('"type":"response"');
    expect(lastCall).toContain('"timestamp"');
    expect(lastCall).toContain('"data"');
    expect(lastCall).toContain('"success":true');
    expect(lastCall).toMatch(/\n$/); // Ends with newline
  });
  
  it('should log errors as JSONL', () => {
    const error = new Error('Test error');
    const context = { action: 'executing tool', tool: 'mcp__test' };
    
    logger.logError(error, context);
    
    const lastCall = logger.writeStream.write.mock.calls[1][0];
    expect(lastCall).toContain('"type":"error"');
    expect(lastCall).toContain('"timestamp"');
    expect(lastCall).toContain('"error"');
    expect(lastCall).toContain('"message":"Test error"');
    expect(lastCall).toContain('"context"');
    expect(lastCall).toContain('"tool":"mcp__test"');
    expect(lastCall).toMatch(/\n$/); // Ends with newline
  });
  
  it('should write footer on close', () => {
    logger.close();
    
    const lastCall = logger.writeStream.write.mock.calls[1][0];
    expect(lastCall).toContain('"type":"meta"');
    expect(lastCall).toContain('"event":"shutdown"');
    expect(lastCall).toContain('"timestamp"');
  });
  
  it('should not log when disabled', () => {
    const disabledLogger = new McpLogger({ enabled: false });
    
    disabledLogger.logRequest({ method: 'test' });
    disabledLogger.logResponse({ result: 'test' });
    disabledLogger.logError(new Error('test'));
    
    // Should not create a write stream
    expect(disabledLogger.writeStream).toBeNull();
  });
  
  it('should provide a singleton instance', () => {
    const instance1 = McpLogger.getInstance();
    const instance2 = McpLogger.getInstance();
    
    expect(instance1).toBe(instance2);
  });
  
  it('should log generic messages', () => {
    logger.logMessage('info', 'Test message', { source: 'unittest' });
    
    const lastCall = logger.writeStream.write.mock.calls[1][0];
    expect(lastCall).toContain('"type":"message"');
    expect(lastCall).toContain('"level":"info"');
    expect(lastCall).toContain('"message":"Test message"');
    expect(lastCall).toContain('"source":"unittest"');
  });
});