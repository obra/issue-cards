// ABOUTME: Tests for the serve command which starts the MCP server for AI integration
// ABOUTME: Verifies the command registration, options, and action execution

const { Command } = require('commander');
const { createCommand, serveAction } = require('../../src/commands/serve');
const { startServer } = require('../../src/utils/mcpServer');

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/utils/issueManager', () => ({
  getCurrentDirectory: jest.fn().mockReturnValue('/fake/issues/dir'),
  getIssuesDirectory: jest.fn().mockReturnValue('/fake/issues/dir'),
}));

jest.mock('../../src/utils/outputManager', () => ({
  success: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../src/utils/mcpServer', () => ({
  startServer: jest.fn().mockImplementation(() => {
    return {
      address: jest.fn().mockReturnValue({ address: 'localhost', port: 3000 })
    };
  }),
  stopServer: jest.fn().mockResolvedValue(undefined),
}));

// Mock process.on to prevent SIGINT handler from being attached in tests
const originalProcessOn = process.on;
process.on = jest.fn();

describe('serve command', () => {
  let command;

  beforeEach(() => {
    jest.clearAllMocks();
    command = createCommand();
  });

  afterAll(() => {
    // Restore original process.on
    process.on = originalProcessOn;
  });

  it('should create a command with the correct name and description', () => {
    expect(command.name()).toBe('serve');
    expect(command.description()).toContain('Start MCP server for AI integration');
  });

  it('should configure the expected options', () => {
    const options = command.options;
    
    // Check port option
    const portOption = options.find(opt => opt.short === '-p');
    expect(portOption).toBeDefined();
    expect(portOption.long).toBe('--port');
    expect(portOption.defaultValue).toBe(3000);
    
    // Check host option
    const hostOption = options.find(opt => opt.short === '-H');
    expect(hostOption).toBeDefined();
    expect(hostOption.long).toBe('--host');
    expect(hostOption.defaultValue).toBe('localhost');
    
    // Check token option
    const tokenOption = options.find(opt => opt.long === '--token');
    expect(tokenOption).toBeDefined();
    expect(tokenOption.short).toBe('-t');
  });

  it('should start the server with the provided options', async () => {
    const options = { 
      port: 3000, 
      host: 'localhost', 
      token: 'secret-token' 
    };
    
    await serveAction(options);
    
    expect(startServer).toHaveBeenCalledWith({
      port: 3000,
      host: 'localhost',
      token: 'secret-token'
    });
  });

  it('should show a warning if no token is provided', async () => {
    const outputManager = require('../../src/utils/outputManager');
    
    await serveAction({ port: 3000, host: 'localhost' });
    
    expect(outputManager.warning).toHaveBeenCalledWith(
      expect.stringContaining('No authentication token provided')
    );
  });

  it('should throw an error if issue tracking is not initialized', async () => {
    const { isInitialized } = require('../../src/utils/directory');
    isInitialized.mockResolvedValueOnce(false);
    
    await expect(serveAction({ port: 3000 })).rejects.toThrow(
      expect.objectContaining({
        displayMessage: expect.stringContaining('not initialized')
      })
    );
  });

  it('should throw an error for invalid port number', async () => {
    await expect(serveAction({ port: 'invalid' })).rejects.toThrow(
      expect.objectContaining({
        displayMessage: expect.stringContaining('Invalid port number')
      })
    );
  });
});