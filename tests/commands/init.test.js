// ABOUTME: Tests for the init command
// ABOUTME: Verifies initialization of the issue tracking system

const { mockOutputManager } = require('../utils/testHelpers');
const directory = require('../../src/utils/directory');
const templateInit = require('../../src/utils/templateInit');

// Create mocks first
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
  createDirectoryStructure: jest.fn(),
}));

jest.mock('../../src/utils/templateInit', () => ({
  copyDefaultTemplates: jest.fn(),
}));

// Setup mock for outputManager
const mockOutput = mockOutputManager();
jest.mock('../../src/utils/outputManager', () => mockOutput);

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Now import modules under test
const { Command } = require('commander');
const { createCommand, initAction } = require('../../src/commands/init');

describe('Init command', () => {
  let commandInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockOutput._reset();
    
    // Create a fresh command instance
    commandInstance = new Command();
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
    test('creates directory structure and copies templates when not already initialized', async () => {
      // Mock isInitialized to return false (not initialized)
      directory.isInitialized.mockResolvedValue(false);
      
      await initAction();
      
      // Verify directory creation was called
      expect(directory.createDirectoryStructure).toHaveBeenCalled();
      
      // Verify templates were copied
      expect(templateInit.copyDefaultTemplates).toHaveBeenCalled();
      
      // Verify success messages were logged
      expect(mockOutput.success).toHaveBeenCalledWith(expect.stringContaining('Initialized'));
      expect(mockOutput._captured.stdout).toContainEqual(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Initialized issue tracking system')
        })
      );
    });
    
    test('shows message when already initialized', async () => {
      // Mock isInitialized to return true (already initialized)
      directory.isInitialized.mockResolvedValue(true);
      
      await initAction();
      
      // Verify directory creation was NOT called
      expect(directory.createDirectoryStructure).not.toHaveBeenCalled();
      
      // Verify success message was logged
      expect(mockOutput.success).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
      expect(mockOutput._captured.stdout).toContainEqual(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('already initialized')
        })
      );
    });
    
    test('handles errors during initialization', async () => {
      // Mock isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      // Mock createDirectoryStructure to throw error
      const error = new Error('Failed to create directories');
      directory.createDirectoryStructure.mockRejectedValue(error);
      
      await initAction();
      
      // Verify error message was logged
      expect(mockOutput.error).toHaveBeenCalledWith(expect.stringContaining('Failed to initialize'));
      expect(mockOutput._captured.stderr).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to initialize')
        })
      );
    });
  });
});