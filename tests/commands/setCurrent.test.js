// ABOUTME: Tests for the set-current command
// ABOUTME: Verifies issue setting functionality

const { Command } = require('commander');
const { createCommand, setCurrentAction } = require('../../src/commands/setCurrent');

// Mock dependencies first
jest.mock('../../src/utils/outputManager', () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  blank: jest.fn(),
  section: jest.fn(),
}));

jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
  getIssueDirectoryPath: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  listIssues: jest.fn(),
  getIssue: jest.fn(),
  issueExists: jest.fn(),
  setCurrentIssue: jest.fn(),
  getCurrentIssue: jest.fn(),
}));

// Import the mocked dependencies
const { Command: OriginalCommand } = require('commander');
const outputManager = require('../../src/utils/outputManager');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const { UninitializedError, UserError, SystemError, IssueNotFoundError } = require('../../src/utils/errors');

describe('Set Current command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup directory mock
    directory.isInitialized.mockResolvedValue(true);
    directory.getIssueDirectoryPath.mockImplementation((subdir) => {
      if (subdir === 'open') return '/project/.issues/open';
      if (subdir === 'closed') return '/project/.issues/closed';
      return '/project/.issues';
    });
  });
  
  describe('createCommand', () => {
    test('creates a properly configured command', () => {
      const command = createCommand();
      
      expect(command.name()).toBe('set-current');
      expect(command.description()).toContain('Set current issue');
      
      // Verify action handler is set
      const actionHandler = command._actionHandler;
      expect(typeof actionHandler).toBe('function');
      
      // Verify required issue option
      const options = command.options;
      const issueOption = options.find(opt => opt.long === '--issue');
      expect(issueOption).toBeDefined();
      expect(issueOption.required).toBe(true);
      expect(issueOption.short).toBe('-i');
    });
  });
  
  describe('setCurrentAction', () => {
    test('sets the current issue', async () => {
      // Mock issue exists
      issueManager.issueExists.mockResolvedValue(true);
      
      // Mock setCurrentIssue success
      issueManager.setCurrentIssue.mockResolvedValue();
      
      await setCurrentAction({ issue: '0001' });
      
      // Verify the issue exists check
      expect(issueManager.issueExists).toHaveBeenCalledWith('0001');
      
      // Verify current issue was set
      expect(issueManager.setCurrentIssue).toHaveBeenCalledWith('0001');
      
      // Verify success message
      expect(outputManager.success).toHaveBeenCalledWith(expect.stringContaining('Issue #0001 is now current'));
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await expect(setCurrentAction({ issue: '0001' })).rejects.toThrow('Issue tracking is not initialized');
      
      // Verify setCurrentIssue was not called
      expect(issueManager.setCurrentIssue).not.toHaveBeenCalled();
    });
    
    test('shows error when issue does not exist', async () => {
      // Mock issue doesn't exist
      issueManager.issueExists.mockResolvedValue(false);
      
      await expect(setCurrentAction({ issue: '9999' })).rejects.toThrow('Issue #9999 not found');
      
      // Verify setCurrentIssue was not called
      expect(issueManager.setCurrentIssue).not.toHaveBeenCalled();
    });
    
    test('shows error for issue number zero', async () => {
      await expect(setCurrentAction({ issue: '0' })).rejects.toThrow('Invalid issue number');
      
      // Verify setCurrentIssue was not called
      expect(issueManager.setCurrentIssue).not.toHaveBeenCalled();
    });
    
    test('shows error for negative issue number', async () => {
      await expect(setCurrentAction({ issue: '-1' })).rejects.toThrow('Invalid issue number');
      
      // Verify setCurrentIssue was not called
      expect(issueManager.setCurrentIssue).not.toHaveBeenCalled();
    });
    
    test('shows error for non-numeric issue number', async () => {
      await expect(setCurrentAction({ issue: 'abc' })).rejects.toThrow('Invalid issue number');
      
      // Verify setCurrentIssue was not called
      expect(issueManager.setCurrentIssue).not.toHaveBeenCalled();
    });
    
    test('handles system errors during issue setting', async () => {
      // Mock issue exists
      issueManager.issueExists.mockResolvedValue(true);
      
      // Mock setCurrentIssue to throw error
      const error = new Error('Disk full');
      issueManager.setCurrentIssue.mockRejectedValue(error);
      
      await expect(setCurrentAction({ issue: '0001' })).rejects.toThrow('Failed to set current issue');
      
      // Verify issue existence was checked
      expect(issueManager.issueExists).toHaveBeenCalledWith('0001');
    });
  });
});