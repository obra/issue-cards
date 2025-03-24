// ABOUTME: Tests for the init command
// ABOUTME: Verifies initialization of the issue tracking system

const { Command } = require('commander');
const { createCommand, initAction } = require('../../src/commands/init');
const directory = require('../../src/utils/directory');
const output = require('../../src/utils/output');

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
  createDirectoryStructure: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  formatSuccess: jest.fn(msg => `SUCCESS: ${msg}`),
  formatError: jest.fn(msg => `ERROR: ${msg}`),
}));

describe('Init command', () => {
  let commandInstance;
  let mockConsoleLog;
  let mockConsoleError;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a fresh command instance
    commandInstance = new Command();
  });
  
  afterEach(() => {
    // Restore console mocks
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });
  
  describe('createCommand', () => {
    test('creates a properly configured command', () => {
      const command = createCommand();
      
      expect(command.name()).toBe('init');
      expect(command.description()).toContain('Initialize');
      
      // Verify action handler is set
      const actionHandler = command._actionHandler;
      expect(typeof actionHandler).toBe('function');
    });
  });
  
  describe('initAction', () => {
    test('creates directory structure when not already initialized', async () => {
      // Mock isInitialized to return false (not initialized)
      directory.isInitialized.mockResolvedValue(false);
      
      await initAction();
      
      // Verify directory creation was called
      expect(directory.createDirectoryStructure).toHaveBeenCalled();
      
      // Verify success message was logged
      expect(output.formatSuccess).toHaveBeenCalledWith(expect.stringContaining('Initialized'));
      expect(console.log).toHaveBeenCalled();
    });
    
    test('shows error when already initialized', async () => {
      // Mock isInitialized to return true (already initialized)
      directory.isInitialized.mockResolvedValue(true);
      
      await initAction();
      
      // Verify directory creation was NOT called
      expect(directory.createDirectoryStructure).not.toHaveBeenCalled();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
      expect(console.error).toHaveBeenCalled();
    });
    
    test('handles errors during initialization', async () => {
      // Mock isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      // Mock createDirectoryStructure to throw error
      const error = new Error('Failed to create directories');
      directory.createDirectoryStructure.mockRejectedValue(error);
      
      await initAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('Failed to initialize'));
      expect(console.error).toHaveBeenCalled();
    });
  });
});