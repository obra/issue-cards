// ABOUTME: Tests for the show command
// ABOUTME: Verifies displaying issue details

const { Command } = require('commander');
const { createCommand, showAction } = require('../../src/commands/show');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const output = require('../../src/utils/output');

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  getIssue: jest.fn(),
  listIssues: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  formatSuccess: jest.fn(msg => `SUCCESS: ${msg}`),
  formatError: jest.fn(msg => `ERROR: ${msg}`),
}));

describe('Show command', () => {
  let commandInstance;
  let mockConsoleLog;
  let mockConsoleError;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    // Restore console mocks
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });
  
  describe('createCommand', () => {
    test('creates a properly configured command', () => {
      const command = createCommand();
      
      expect(command.name()).toBe('show');
      expect(command.description()).toContain('Show issue details');
      
      // Verify action handler is set
      const actionHandler = command._actionHandler;
      expect(typeof actionHandler).toBe('function');
    });
  });
  
  describe('showAction', () => {
    test('shows specific issue when number provided', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.getIssue to return issue content
      const mockContent = '# Issue 0001: Test Issue\n\nContent here';
      issueManager.getIssue.mockResolvedValue(mockContent);
      
      await showAction('0001');
      
      // Verify issue content was displayed
      expect(issueManager.getIssue).toHaveBeenCalledWith('0001');
      expect(console.log).toHaveBeenCalledWith(mockContent);
    });
    
    test('shows error when issue not found', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.getIssue to throw error
      issueManager.getIssue.mockRejectedValue(new Error('Issue #0001 not found'));
      
      await showAction('0001');
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('Issue #0001 not found'));
      expect(console.error).toHaveBeenCalled();
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await showAction('0001');
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('not initialized'));
      expect(console.error).toHaveBeenCalled();
      expect(issueManager.getIssue).not.toHaveBeenCalled();
    });
    
    test('handles errors during issue display', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.getIssue to throw unexpected error
      issueManager.getIssue.mockRejectedValue(new Error('Failed to read issue'));
      
      await showAction('0001');
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('Failed to show issue'));
      expect(console.error).toHaveBeenCalled();
    });
    
    test('shows current issue when no number provided', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issue list
      const mockIssues = [
        { number: '0001', title: 'First Issue', content: '# Issue 0001: First Issue\n\nContent here' },
        { number: '0002', title: 'Second Issue', content: '# Issue 0002: Second Issue\n\nContent here' }
      ];
      issueManager.listIssues.mockResolvedValue(mockIssues);
      
      await showAction();
      
      // Verify first issue content was displayed (current issue)
      expect(issueManager.listIssues).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(mockIssues[0].content);
    });
    
    test('shows error when no issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      await showAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('No open issues'));
      expect(console.error).toHaveBeenCalled();
    });
  });
});