// ABOUTME: Tests for the show command
// ABOUTME: Verifies displaying issue details

const { Command } = require('commander');
const { mockOutputManager } = require('../utils/testHelpers');
const { UninitializedError, IssueNotFoundError, UserError, SystemError } = require('../../src/utils/errors');

// Mock dependencies first
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  getIssue: jest.fn(),
  listIssues: jest.fn(),
}));

// Create mock output manager and then mock it
const mockOutput = mockOutputManager();
jest.mock('../../src/utils/outputManager', () => mockOutput);

// Import the mocked module
const outputManager = require('../../src/utils/outputManager');

// Mock process.exit to prevent tests from exiting
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Import the module under test after mocking
const { createCommand, showAction } = require('../../src/commands/show');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');

describe('Show command', () => {
  let commandInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock output functions
    outputManager.success.mockClear();
    outputManager.error.mockClear();
    outputManager.info.mockClear();
    outputManager.raw.mockClear();
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
      expect(mockOutput.raw).toHaveBeenCalledWith(mockContent);
      expect(mockOutput._captured.stdout).toHaveLength(1);
    });
    
    test('throws error when issue not found', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.getIssue to throw error
      issueManager.getIssue.mockRejectedValue(new Error('Issue #0001 not found'));
      
      try {
        await showAction('0001');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IssueNotFoundError);
        expect(error.message).toContain('Issue #0001 not found');
        expect(error.displayMessage).toContain('Issue #0001 not found');
      }
    });
    
    test('throws error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      try {
        await showAction('0001');
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UninitializedError);
        expect(error.displayMessage).toContain('not initialized');
        expect(error.displayMessage).toContain('Run `issue-cards init` first');
      }
      
      expect(issueManager.getIssue).not.toHaveBeenCalled();
    });
    
    test('throws wrapped error for unexpected errors during issue display', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.getIssue to throw unexpected error
      issueManager.getIssue.mockRejectedValue(new Error('Failed to read issue'));
      
      try {
        await showAction('0001');
        fail('Expected an error to be thrown');
      } catch (error) {
        // The error is caught and wrapped in IssueNotFoundError in the code
        expect(error).toBeInstanceOf(IssueNotFoundError);
        expect(error.displayMessage).toContain('Issue #0001 not found');
      }
    });
    
    test('shows current issue when no number provided', async () => {
      // Reset mock output
      mockOutput._reset();
      
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
      expect(mockOutput.raw).toHaveBeenCalledWith(mockIssues[0].content);
      expect(mockOutput._captured.stdout).toHaveLength(1);
    });
    
    test('throws error when no issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      try {
        await showAction();
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserError);
        expect(error.message).toContain('No open issues found');
        expect(error.displayMessage).toContain('No open issues found');
      }
    });
  });
});