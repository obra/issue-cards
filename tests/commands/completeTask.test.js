// ABOUTME: Tests for the complete-task command
// ABOUTME: Verifies task completion functionality

const { Command } = require('commander');
const { createCommand, completeTaskAction } = require('../../src/commands/completeTask');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const taskParser = require('../../src/utils/taskParser');
const output = require('../../src/utils/output');

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
  getIssueDirectoryPath: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  listIssues: jest.fn(),
  getIssue: jest.fn(),
  saveIssue: jest.fn(),
}));

jest.mock('../../src/utils/taskParser', () => ({
  extractTasks: jest.fn(),
  findCurrentTask: jest.fn(),
  updateTaskStatus: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  formatSuccess: jest.fn(msg => `SUCCESS: ${msg}`),
  formatError: jest.fn(msg => `ERROR: ${msg}`),
}));

// Mock git utilities
jest.mock('../../src/utils/gitDetection', () => ({
  isGitAvailable: jest.fn().mockReturnValue(true),
  isGitRepository: jest.fn().mockResolvedValue(true),
  getGitRoot: jest.fn(),
}));

jest.mock('../../src/utils/gitOperations', () => ({
  gitStage: jest.fn().mockResolvedValue(''),
  gitStatus: jest.fn(),
  gitShowTrackedFiles: jest.fn(),
  safelyExecuteGit: jest.fn(),
}));

const gitDetection = require('../../src/utils/gitDetection');
const gitOperations = require('../../src/utils/gitOperations');

describe('Complete Task command', () => {
  let commandInstance;
  let mockConsoleLog;
  let mockConsoleError;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Setup directory mock
    directory.getIssueDirectoryPath.mockImplementation((subdir) => {
      if (subdir === 'open') return '/project/.issues/open';
      if (subdir === 'closed') return '/project/.issues/closed';
      return '/project/.issues';
    });
  });
  
  afterEach(() => {
    // Restore console mocks
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });
  
  describe('createCommand', () => {
    test('creates a properly configured command', () => {
      const command = createCommand();
      
      expect(command.name()).toBe('complete-task');
      expect(command.description()).toContain('Mark current task as complete');
      
      // Verify action handler is set
      const actionHandler = command._actionHandler;
      expect(typeof actionHandler).toBe('function');
    });
  });
  
  describe('completeTaskAction', () => {
    test('completes current task and shows next task', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issues
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      ]);
      
      // Mock taskParser.extractTasks to return tasks
      const tasks = [
        { text: 'First task', completed: false, index: 0 },
        { text: 'Second task', completed: false, index: 1 }
      ];
      taskParser.extractTasks.mockResolvedValue(tasks);
      
      // Mock taskParser.findCurrentTask to return the current task
      taskParser.findCurrentTask.mockReturnValue(tasks[0]);
      
      // Mock taskParser.updateTaskStatus to return updated content
      const updatedContent = '# Issue 0001: Test Issue\n\n## Tasks\n- [x] First task\n- [ ] Second task';
      taskParser.updateTaskStatus.mockResolvedValue(updatedContent);
      
      await completeTaskAction();
      
      // Verify task was updated
      expect(taskParser.updateTaskStatus).toHaveBeenCalledWith('# Issue 0001: Test Issue', 0, true);
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', updatedContent);
      
      // Verify success message was logged
      expect(output.formatSuccess).toHaveBeenCalledWith(expect.stringContaining('Completed: First task'));
      expect(console.log).toHaveBeenCalled();
      
      // Verify git staging was attempted
      expect(gitOperations.gitStage).toHaveBeenCalledWith('/project/.issues/open/issue-0001.md');
    });
    
    test('handles case when all tasks are completed', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issues
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      ]);
      
      // Mock taskParser.extractTasks to return tasks with last task not completed
      const tasks = [
        { text: 'First task', completed: true, index: 0 },
        { text: 'Last task', completed: false, index: 1 }
      ];
      taskParser.extractTasks.mockResolvedValue(tasks);
      
      // Mock taskParser.findCurrentTask to return the last task
      taskParser.findCurrentTask.mockReturnValue(tasks[1]);
      
      // Mock taskParser.updateTaskStatus to return updated content with all tasks completed
      const updatedContent = '# Issue 0001: Test Issue\n\n## Tasks\n- [x] First task\n- [x] Last task';
      taskParser.updateTaskStatus.mockResolvedValue(updatedContent);
      
      // Mock extractTasks for the updated content to have all tasks completed
      taskParser.extractTasks
        .mockResolvedValueOnce(tasks) // First call returns initial tasks
        .mockResolvedValueOnce([ // Second call returns all completed tasks
          { text: 'First task', completed: true, index: 0 },
          { text: 'Last task', completed: true, index: 1 }
        ]);
      
      taskParser.findCurrentTask
        .mockReturnValueOnce(tasks[1]) // First call returns the last task
        .mockReturnValueOnce(null);    // Second call returns null (all completed)
      
      await completeTaskAction();
      
      // Verify task was updated
      expect(taskParser.updateTaskStatus).toHaveBeenCalledWith('# Issue 0001: Test Issue', 1, true);
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', updatedContent);
      
      // Verify completion message was logged
      expect(output.formatSuccess).toHaveBeenCalledWith(expect.stringContaining('All tasks complete'));
      expect(console.log).toHaveBeenCalled();
    });
    
    test('shows error when no open issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      await completeTaskAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('No open issues'));
      expect(console.error).toHaveBeenCalled();
    });
    
    test('shows error when no current task exists', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issues
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      ]);
      
      // Mock taskParser.extractTasks to return tasks
      taskParser.extractTasks.mockResolvedValue([]);
      
      // Mock taskParser.findCurrentTask to return null (no current task)
      taskParser.findCurrentTask.mockReturnValue(null);
      
      await completeTaskAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('No tasks found'));
      expect(console.error).toHaveBeenCalled();
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await completeTaskAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('not initialized'));
      expect(console.error).toHaveBeenCalled();
    });
    
    test('skips git staging if git is not available', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issues
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      ]);
      
      // Mock taskParser.extractTasks to return tasks
      const tasks = [
        { text: 'First task', completed: false, index: 0 }
      ];
      taskParser.extractTasks.mockResolvedValue(tasks);
      
      // Mock taskParser.findCurrentTask to return the current task
      taskParser.findCurrentTask.mockReturnValue(tasks[0]);
      
      // Mock taskParser.updateTaskStatus to return updated content
      const updatedContent = '# Issue 0001: Test Issue\n\n## Tasks\n- [x] First task';
      taskParser.updateTaskStatus.mockResolvedValue(updatedContent);
      
      // Mock git not available
      gitDetection.isGitAvailable.mockReturnValue(false);
      
      await completeTaskAction();
      
      // Verify task was updated
      expect(taskParser.updateTaskStatus).toHaveBeenCalledWith('# Issue 0001: Test Issue', 0, true);
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', updatedContent);
      
      // Verify success message was logged
      expect(output.formatSuccess).toHaveBeenCalledWith(expect.stringContaining('Completed: First task'));
      expect(console.log).toHaveBeenCalled();
      
      // Verify git staging was not attempted
      expect(gitOperations.gitStage).not.toHaveBeenCalled();
    });
  });
});