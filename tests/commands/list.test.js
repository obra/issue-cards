// ABOUTME: Tests for the list command
// ABOUTME: Verifies listing of open issues

const { Command } = require('commander');
const { createCommand, listAction } = require('../../src/commands/list');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const { mockOutputManager } = require('../utils/testHelpers');
const { UninitializedError } = require('../../src/utils/errors');

// Mock the output manager
const outputManager = mockOutputManager();

// Manually mock the outputManager module
jest.mock('../../src/utils/outputManager', () => outputManager, { virtual: true });

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  listIssues: jest.fn(),
}));

describe('List command', () => {
  let commandInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    outputManager._reset();
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
      
      // Verify issues were listed using the section method
      expect(outputManager.section).toHaveBeenCalledWith(
        'Open Issues',
        expect.arrayContaining(['#0001: First Issue', '#0002: Second Issue'])
      );

      // Verify total count info message
      expect(outputManager.info).toHaveBeenCalledWith('Total: 2 open issues');
      
      // Check the captured stdout for sections
      const sectionCalls = outputManager._captured.stdout.filter(entry => entry.type === 'section');
      expect(sectionCalls.length).toBe(1);
      expect(sectionCalls[0].message).toContain('Open Issues');
    });
    
    test('shows message when no issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      await listAction();
      
      // Verify message about no issues was shown
      expect(outputManager.info).toHaveBeenCalledWith('No open issues found.');
      
      // Check the captured stdout
      const infoCalls = outputManager._captured.stdout.filter(entry => entry.type === 'info');
      expect(infoCalls.length).toBe(1);
      expect(infoCalls[0].message).toContain('No open issues');
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await listAction();
      
      // Verify error message was logged using the error method
      expect(outputManager.error).toHaveBeenCalledWith('Issue tracking is not initialized (Run `issue-cards init` first)');
      
      // Check the captured stderr
      const errorCalls = outputManager._captured.stderr.filter(entry => entry.type === 'error');
      expect(errorCalls.length).toBe(1);
      expect(errorCalls[0].message).toContain('Issue tracking is not initialized');
      
      // Verify the listIssues method wasn't called
      expect(issueManager.listIssues).not.toHaveBeenCalled();
    });
    
    test('handles errors during issue listing', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to throw error
      issueManager.listIssues.mockRejectedValue(new Error('Failed to list issues'));
      
      await listAction();
      
      // Verify error message was logged
      expect(outputManager.error).toHaveBeenCalledWith('Failed to list issues: Failed to list issues');
      
      // Check the captured stderr
      const errorCalls = outputManager._captured.stderr.filter(entry => entry.type === 'error');
      expect(errorCalls.length).toBe(1);
      expect(errorCalls[0].message).toContain('Failed to list issues');
    });
  });
});