// ABOUTME: Tests for the current command
// ABOUTME: Verifies current task display functionality

const { Command } = require('commander');
const { createCommand, currentAction } = require('../../src/commands/current');
// Get our mocked versions after setting up the mocks
const outputManager = require('../../src/utils/outputManager');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const taskParser = require('../../src/utils/taskParser');
const taskExpander = require('../../src/utils/taskExpander');
const { UninitializedError, UserError, SystemError } = require('../../src/utils/errors');

// Mock outputManager and other dependencies
jest.mock('../../src/utils/outputManager', () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  section: jest.fn(),
  debug: jest.fn()
}));

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  listIssues: jest.fn(),
  getIssue: jest.fn(),
  getCurrentIssue: jest.fn(),
}));

jest.mock('../../src/utils/taskParser', () => ({
  extractTasks: jest.fn(),
  findCurrentTask: jest.fn(),
}));

jest.mock('../../src/utils/taskExpander', () => ({
  expandTask: jest.fn(),
}));

describe('Current command', () => {
  let commandInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createCommand', () => {
    test('creates a properly configured command', () => {
      const command = createCommand();
      
      expect(command.name()).toBe('current');
      expect(command.description()).toContain('Show current task');
      
      // Verify action handler is set
      const actionHandler = command._actionHandler;
      expect(typeof actionHandler).toBe('function');
    });
  });
  
  describe('currentAction', () => {
    test('shows current task with expanded steps', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issues
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      ]);
      
      // Mock getCurrentIssue to return the current issue
      issueManager.getCurrentIssue.mockResolvedValue(
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      );
      
      // Mock taskParser.extractTasks to return tasks
      const tasks = [
        { text: 'First task', completed: false, index: 0 },
        { text: 'Second task', completed: false, index: 1 }
      ];
      taskParser.extractTasks.mockResolvedValue(tasks);
      
      // Mock taskParser.findCurrentTask to return the current task
      taskParser.findCurrentTask.mockReturnValue(tasks[0]);
      
      // Mock taskExpander.expandTask to return expanded steps
      const expandedSteps = [
        'Write unit tests',
        'First task',
        'Run unit tests'
      ];
      taskExpander.expandTask.mockResolvedValue(expandedSteps);
      
      await currentAction();
      
      // Verify outputs
      expect(taskParser.extractTasks).toHaveBeenCalledWith('# Issue 0001: Test Issue');
      expect(taskParser.findCurrentTask).toHaveBeenCalledWith(tasks);
      expect(taskExpander.expandTask).toHaveBeenCalledWith(tasks[0]);
      
      // Check section output - the display utility uses 'CURRENT TASK' format
      expect(outputManager.section).toHaveBeenCalledWith('CURRENT TASK', 'First task');
      
      // Verify upcoming tasks section called
      expect(outputManager.section).toHaveBeenCalledWith('UPCOMING TASKS', expect.any(Array));
      
      // Verify the output manager was called enough times
      expect(outputManager.section.mock.calls.length).toBeGreaterThanOrEqual(2);
      
      // Check for specific content in the calls
      expect(outputManager.section).toHaveBeenCalledWith(expect.stringContaining('TASK'), expect.any(String));
      expect(outputManager.section).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('First task'));
      
      // Verify instruction message was output
      expect(outputManager.info).toHaveBeenCalledWith(expect.stringContaining('Unless you have explicit instructions to the contrary'));
    });
    
    test('throws error when no open issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      try {
        await currentAction();
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserError);
        expect(error.displayMessage).toContain('No open issues');
      }
    });
    
    test('shows success when all tasks are completed', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issues
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      ]);
      
      // Mock getCurrentIssue to return the current issue
      issueManager.getCurrentIssue.mockResolvedValue(
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      );
      
      // Mock taskParser.extractTasks to return completed tasks
      const tasks = [
        { text: 'First task', completed: true, index: 0 },
        { text: 'Second task', completed: true, index: 1 }
      ];
      taskParser.extractTasks.mockResolvedValue(tasks);
      
      // Mock taskParser.findCurrentTask to return null (all tasks completed)
      taskParser.findCurrentTask.mockReturnValue(null);
      
      await currentAction();
      
      // Verify success was called once with the right message
      expect(outputManager.success).toHaveBeenCalledTimes(1);
      expect(outputManager.success).toHaveBeenCalledWith(expect.stringContaining('All tasks completed'));
    });
    
    test('throws error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      try {
        await currentAction();
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UninitializedError);
        expect(error.displayMessage).toContain('Issue tracking is not initialized');
      }
    });
    
    test('wraps and throws system errors', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock listIssues to throw a generic error
      issueManager.listIssues.mockRejectedValue(new Error('Database error'));
      
      try {
        await currentAction();
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SystemError);
        expect(error.message).toContain('Failed to show current task');
        expect(error.displayMessage).toContain('Failed to show current task: Database error');
      }
    });
    
    test('extracts context from issue and displays it', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issues with context
      const issueContent = `# Issue 0001: Test Issue

## Problem to be solved
This is a test problem.

## Failed approaches
- Failed approach 1
- Failed approach 2

## Instructions
Follow these instructions.

## Tasks
- [ ] First task
- [ ] Second task
`;
      
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Test Issue', content: issueContent }
      ]);
      
      // Mock getCurrentIssue to return the current issue
      issueManager.getCurrentIssue.mockResolvedValue(
        { number: '0001', title: 'Test Issue', content: issueContent }
      );
      
      // Mock taskParser.extractTasks to return tasks
      const tasks = [
        { text: 'First task', completed: false, index: 0 },
        { text: 'Second task', completed: false, index: 1 }
      ];
      taskParser.extractTasks.mockResolvedValue(tasks);
      
      // Mock taskParser.findCurrentTask to return the current task
      taskParser.findCurrentTask.mockReturnValue(tasks[0]);
      
      // Mock taskExpander.expandTask to return task
      taskExpander.expandTask.mockResolvedValue(['First task']);
      
      await currentAction();
      
      // Verify context sections were output
      expect(outputManager.section).toHaveBeenCalledWith('Problem to be solved', 'This is a test problem.');
      expect(outputManager.section).toHaveBeenCalledWith('Failed approaches', ['Failed approach 1', 'Failed approach 2']);
      expect(outputManager.section).toHaveBeenCalledWith('Instructions', 'Follow these instructions.');
    });
  });
});