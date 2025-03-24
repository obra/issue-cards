// ABOUTME: Tests for the list command
// ABOUTME: Verifies listing of open issues

const { Command } = require('commander');
const { createCommand, listAction } = require('../../src/commands/list');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const output = require('../../src/utils/output');

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  listIssues: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  formatSuccess: jest.fn(msg => `SUCCESS: ${msg}`),
  formatError: jest.fn(msg => `ERROR: ${msg}`),
}));

describe('List command', () => {
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
      
      expect(command.name()).toBe('list');
      expect(command.description()).toContain('List all open issues');
      
      // Verify action handler is set
      const actionHandler = command._actionHandler;
      expect(typeof actionHandler).toBe('function');
    });
  });
  
  describe('listAction', () => {
    test('lists open issues when they exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issue list
      const mockIssues = [
        { number: '0001', title: 'First Issue', content: '# Issue 0001: First Issue' },
        { number: '0002', title: 'Second Issue', content: '# Issue 0002: Second Issue' }
      ];
      issueManager.listIssues.mockResolvedValue(mockIssues);
      
      await listAction();
      
      // Verify issues were listed
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Open Issues:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('#0001: First Issue'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('#0002: Second Issue'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Total: 2 open issues'));
    });
    
    test('shows message when no issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      await listAction();
      
      // Verify message about no issues was shown
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No open issues'));
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await listAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('not initialized'));
      expect(console.error).toHaveBeenCalled();
      expect(issueManager.listIssues).not.toHaveBeenCalled();
    });
    
    test('handles errors during issue listing', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to throw error
      issueManager.listIssues.mockRejectedValue(new Error('Failed to list issues'));
      
      await listAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('Failed to list issues'));
      expect(console.error).toHaveBeenCalled();
    });
  });
});