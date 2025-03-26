// ABOUTME: Tests for the list command
// ABOUTME: Verifies listing of open issues

const { Command } = require('commander');
const { createCommand, listAction } = require('../../src/commands/list');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
// No need for mockOutputManager since we're mocking directly
const { UninitializedError, SystemError } = require('../../src/utils/errors');

// Mock outputManager
jest.mock('../../src/utils/outputManager', () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  section: jest.fn(),
  debug: jest.fn(),
  configure: jest.fn()
}));

// Import the mocked module
const outputManager = require('../../src/utils/outputManager');

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
    // Reset mock output functions
    outputManager.success.mockClear();
    outputManager.error.mockClear();
    outputManager.info.mockClear();
    outputManager.section.mockClear();
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
      
      // Pass empty options object to match the updated function signature
      await listAction({});
      
      // Verify issues were listed using the section method
      expect(outputManager.section).toHaveBeenCalledWith(
        'Open Issues',
        expect.arrayContaining(['#0001: First Issue', '#0002: Second Issue'])
      );

      // Verify total count info message
      expect(outputManager.info).toHaveBeenCalledWith('Total: 2 open issues');
      
      // Verify the section was called correctly
      expect(outputManager.section.mock.calls.length).toBe(1);
      expect(outputManager.section).toHaveBeenCalledWith(
        'Open Issues',
        expect.arrayContaining(['#0001: First Issue', '#0002: Second Issue'])
      );
    });
    
    test('shows message when no issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      // Pass empty options object to match the updated function signature
      await listAction({});
      
      // Verify message about no issues was shown
      expect(outputManager.info).toHaveBeenCalledWith('No open issues found.');
    });
    
    test('throws error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      try {
        await listAction({});
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UninitializedError);
        expect(error.displayMessage).toContain('Issue tracking is not initialized');
      }
      
      // Verify the listIssues method wasn't called
      expect(issueManager.listIssues).not.toHaveBeenCalled();
    });
    
    test('wraps and throws errors during issue listing', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to throw error
      issueManager.listIssues.mockRejectedValue(new Error('Failed to list issues'));
      
      try {
        await listAction({});
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SystemError);
        expect(error.message).toContain('Failed to list issues');
        expect(error.displayMessage).toContain('Failed to list issues');
      }
    });
    
    test('outputs issues in JSON format when json option is true', async () => {
      // Mock console.log to capture JSON output
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      try {
        // Mock directory.isInitialized to return true
        directory.isInitialized.mockResolvedValue(true);
        
        // Mock issueManager.listIssues to return issue list
        const mockIssues = [
          { number: '0001', title: 'First Issue', content: '# Issue 0001: First Issue' },
          { number: '0002', title: 'Second Issue', content: '# Issue 0002: Second Issue' }
        ];
        issueManager.listIssues.mockResolvedValue(mockIssues);
        
        // Call with json option set to true
        await listAction({ json: true });
        
        // Verify JSON was output
        expect(console.log).toHaveBeenCalledWith(JSON.stringify(mockIssues));
        
        // Verify output manager was configured for JSON
        expect(outputManager.configure).toHaveBeenCalledWith({ json: true });
      } finally {
        // Restore console.log
        console.log = originalConsoleLog;
      }
    });
  });
});