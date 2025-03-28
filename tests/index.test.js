// ABOUTME: Tests for the main entry point to the application
// ABOUTME: Validates command line parsing and error handling behavior

const main = require('../src/index');
const { createProgram } = require('../src/cli');
const outputManager = require('../src/utils/outputManager');
const { IssueCardsError } = require('../src/utils/errors');

// Mock dependencies
jest.mock('../src/cli', () => ({
  createProgram: jest.fn()
}));

jest.mock('../src/utils/outputManager', () => ({
  configure: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  getCapturedOutput: jest.fn().mockReturnValue({ data: { result: 'test' } }),
  reset: jest.fn()
}));

// Mock process
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('Main Application', () => {
  let mockProgram;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock program
    mockProgram = {
      parseAsync: jest.fn().mockResolvedValue({}),
      commands: []
    };
    
    createProgram.mockResolvedValue(mockProgram);
  });
  
  describe('main()', () => {
    it('should create and parse the program', async () => {
      await main();
      
      expect(createProgram).toHaveBeenCalled();
      expect(mockProgram.parseAsync).toHaveBeenCalled();
    });
    
    it('should configure the output manager based on command line arguments', async () => {
      // Save original argv
      const originalArgv = process.argv;
      
      // Set test arguments
      process.argv = ['node', 'script.js', '--verbose', '--json'];
      
      await main();
      
      expect(outputManager.configure).toHaveBeenCalledWith(expect.objectContaining({
        verbose: true,
        json: true
      }));
      
      // Restore argv
      process.argv = originalArgv;
    });
    
    it('should handle IssueCardsError with displayMessage', async () => {
      // Create error with display message
      const testError = new IssueCardsError('Test error');
      testError.code = 42;
      testError.displayMessage = 'User-friendly error message';
      
      // Make program.parseAsync throw the error
      mockProgram.parseAsync.mockRejectedValue(testError);
      
      await main();
      
      expect(outputManager.error).toHaveBeenCalledWith('User-friendly error message');
      expect(mockExit).toHaveBeenCalledWith(42);
    });
    
    it('should handle unexpected errors', async () => {
      // Make program.parseAsync throw a regular error
      const regularError = new Error('Unexpected error');
      mockProgram.parseAsync.mockRejectedValue(regularError);
      
      await main();
      
      expect(outputManager.error).toHaveBeenCalledWith(expect.stringContaining('Unexpected error'));
      expect(mockExit).toHaveBeenCalledWith(1);
    });
    
    it('should show stack trace in debug mode', async () => {
      // Save original argv
      const originalArgv = process.argv;
      
      // Set debug flag
      process.argv = ['node', 'script.js', '--debug'];
      
      // Make program.parseAsync throw a regular error with stack
      const regularError = new Error('Unexpected error');
      regularError.stack = 'Stack trace';
      mockProgram.parseAsync.mockRejectedValue(regularError);
      
      await main();
      
      expect(outputManager.debug).toHaveBeenCalledWith(regularError.stack);
      
      // Restore argv
      process.argv = originalArgv;
    });
  });

  describe('executeCommand()', () => {
    const { executeCommand } = require('../src/index');
    
    it('should execute a command programmatically', async () => {
      // Mock a command with action handler
      const mockAction = jest.fn().mockResolvedValue({ success: true });
      const mockCommand = {
        name: () => 'test-command',
        parseOptions: jest.fn(),
        _actionHandler: mockAction
      };
      
      // Add the command to the program
      mockProgram.commands = [mockCommand];
      
      const result = await executeCommand('test-command', { option1: 'value1' });
      
      expect(outputManager.configure).toHaveBeenCalledWith(expect.objectContaining({ 
        json: true,
        captureOutput: true 
      }));
      expect(mockAction).toHaveBeenCalled();
      expect(outputManager.getCapturedOutput).toHaveBeenCalled();
      expect(outputManager.reset).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: { data: { result: 'test' } }
      });
    });
    
    it('should return error when command not found', async () => {
      mockProgram.commands = [];
      
      const result = await executeCommand('nonexistent', {});
      
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Unknown command');
    });
    
    it('should handle exceptions during command execution', async () => {
      // Mock command that throws an error
      const mockAction = jest.fn().mockRejectedValue(new Error('Command failed'));
      const mockCommand = {
        name: () => 'failing-command',
        parseOptions: jest.fn(),
        _actionHandler: mockAction
      };
      
      mockProgram.commands = [mockCommand];
      
      const result = await executeCommand('failing-command', {});
      
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Command failed');
      expect(outputManager.reset).toHaveBeenCalled();
    });
    
    it('should handle IssueCardsError during command execution', async () => {
      // Create error with display message
      const testError = new IssueCardsError('Test error');
      testError.code = 42;
      testError.displayMessage = 'User-friendly error message';
      testError.recoveryHint = 'Try this instead';
      
      // Mock command that throws the error
      const mockAction = jest.fn().mockRejectedValue(testError);
      const mockCommand = {
        name: () => 'error-command',
        parseOptions: jest.fn(),
        _actionHandler: mockAction
      };
      
      mockProgram.commands = [mockCommand];
      
      const result = await executeCommand('error-command', {});
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(42);
      expect(result.error.message).toBe('User-friendly error message');
      expect(result.error.hint).toBe('Try this instead');
    });
  });
});