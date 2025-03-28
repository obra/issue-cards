// ABOUTME: Tests for the complete-task command
// ABOUTME: Verifies task completion functionality

// Mock dependencies first
jest.mock('../../src/utils/outputManager', () => {
  // Create a mock implementation
  return {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    blank: jest.fn(),
    section: jest.fn(),
    _reset: jest.fn(),
  };
});

jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
  getIssueDirectoryPath: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  listIssues: jest.fn(),
  getIssue: jest.fn(),
  saveIssue: jest.fn(),
  closeIssue: jest.fn(),
  getCurrentIssue: jest.fn(),
}));

jest.mock('../../src/utils/taskParser', () => ({
  extractTasks: jest.fn(),
  findCurrentTask: jest.fn(),
  updateTaskStatus: jest.fn(),
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

jest.mock('../../src/utils/taskExpander', () => ({
  expandTask: jest.fn().mockResolvedValue(['Expanded task step']),
}));

// Import the mocked dependencies
const { Command } = require('commander');
const { createCommand, completeTaskAction } = require('../../src/commands/completeTask');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const taskParser = require('../../src/utils/taskParser');
const outputManager = require('../../src/utils/outputManager');
const gitDetection = require('../../src/utils/gitDetection');
const gitOperations = require('../../src/utils/gitOperations');
const { UninitializedError, UserError, SystemError } = require('../../src/utils/errors');

describe('Complete Task command', () => {
  let commandInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup directory mock
    directory.getIssueDirectoryPath.mockImplementation((subdir) => {
      if (subdir === 'open') return '/project/.issues/open';
      if (subdir === 'closed') return '/project/.issues/closed';
      return '/project/.issues';
    });
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
      
      // Mock getCurrentIssue to return the current issue
      issueManager.getCurrentIssue.mockResolvedValue(
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      );
      
      // Mock taskParser.extractTasks to return tasks
      const initialTasks = [
        { text: 'First task', completed: false, index: 0 },
        { text: 'Second task', completed: false, index: 1 }
      ];
      
      const updatedTasks = [
        { text: 'First task', completed: true, index: 0 },
        { text: 'Second task', completed: false, index: 1 }
      ];
      
      // First call returns initial tasks, second call returns updated tasks with first task completed
      taskParser.extractTasks
        .mockResolvedValueOnce(initialTasks)
        .mockResolvedValueOnce(updatedTasks);
      
      // First call returns first task, second call returns second task
      taskParser.findCurrentTask
        .mockReturnValueOnce(initialTasks[0])
        .mockReturnValueOnce(updatedTasks[1]);
      
      // Mock taskParser.updateTaskStatus to return updated content
      const updatedContent = '# Issue 0001: Test Issue\n\n## Tasks\n- [x] First task\n- [ ] Second task';
      taskParser.updateTaskStatus.mockResolvedValue(updatedContent);
      
      // Mock getIssue to return the same content
      issueManager.getIssue.mockResolvedValue(updatedContent);
      
      await completeTaskAction();
      
      // Verify task was updated
      expect(taskParser.updateTaskStatus).toHaveBeenCalledWith('# Issue 0001: Test Issue', 0, true);
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', updatedContent);
      
      // Verify success message was logged with the new output manager
      expect(outputManager.success).toHaveBeenCalledWith(expect.stringContaining('Task completed: First task'));
      
      // Verify the next task section was shown
      expect(outputManager.section).toHaveBeenCalledWith('NEXT TASK', 'Second task');
      
      // Verify git staging was attempted
      expect(gitOperations.gitStage).toHaveBeenCalledWith('/project/.issues/open/issue-0001.md');
      
      // Verify the staged message was shown
      expect(outputManager.success).toHaveBeenCalledWith('Changes staged in git');
    });
    
    test('handles case when all tasks are completed and closes the issue', async () => {
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
      
      // Mock successful issue closure
      issueManager.closeIssue.mockResolvedValue();
      
      await completeTaskAction();
      
      // Verify task was updated
      expect(taskParser.updateTaskStatus).toHaveBeenCalledWith('# Issue 0001: Test Issue', 1, true);
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', updatedContent);
      
      // Verify issue was closed
      expect(issueManager.closeIssue).toHaveBeenCalledWith('0001');
      
      // Verify git staging was attempted for the closed issue file
      expect(gitOperations.gitStage).toHaveBeenCalledWith('/project/.issues/closed/issue-0001.md');
      
      // Verify completion message was logged
      expect(outputManager.success).toHaveBeenCalledWith(expect.stringContaining('All tasks complete'));
      expect(outputManager.success).toHaveBeenCalledWith(expect.stringContaining('Issue #0001 has been closed'));
      
      // Verify info message was shown
      expect(outputManager.info).toHaveBeenCalledTimes(2);
      expect(outputManager.info).toHaveBeenNthCalledWith(1, expect.stringContaining('Would you like to work on another issue?'));
    });
    
    test('shows error when no open issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      await expect(completeTaskAction()).rejects.toThrow('No open issues');
      
      // Verify issueManager.saveIssue was not called
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('shows error when no current task exists', async () => {
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
      taskParser.extractTasks.mockResolvedValue([]);
      
      // Mock taskParser.findCurrentTask to return null (no current task)
      taskParser.findCurrentTask.mockReturnValue(null);
      
      await expect(completeTaskAction()).rejects.toThrow('No tasks found or all tasks are already completed');
      
      // Verify taskParser.updateTaskStatus was not called
      expect(taskParser.updateTaskStatus).not.toHaveBeenCalled();
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await expect(completeTaskAction()).rejects.toThrow('Issue tracking is not initialized');
      
      // Verify issueManager.listIssues was not called
      expect(issueManager.listIssues).not.toHaveBeenCalled();
    });
    
    test('logs debug message if git operation fails', async () => {
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
        { text: 'First task', completed: false, index: 0 }
      ];
      taskParser.extractTasks.mockResolvedValue(tasks);
      
      // Mock taskParser.findCurrentTask to return the current task
      taskParser.findCurrentTask.mockReturnValue(tasks[0]);
      
      // Mock taskParser.updateTaskStatus to return updated content
      const updatedContent = '# Issue 0001: Test Issue\n\n## Tasks\n- [x] First task';
      taskParser.updateTaskStatus.mockResolvedValue(updatedContent);
      
      // Make git available but throw an error during gitStage
      gitDetection.isGitAvailable.mockReturnValue(true);
      
      // Mock git error during staging
      const gitError = new Error('Git operation failed');
      gitOperations.gitStage.mockRejectedValue(gitError);
      
      // Mock getIssue for context
      issueManager.getIssue.mockResolvedValue(updatedContent);
      
      await completeTaskAction();
      
      // Verify task was updated
      expect(taskParser.updateTaskStatus).toHaveBeenCalledWith('# Issue 0001: Test Issue', 0, true);
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', updatedContent);
      
      // Verify success message was logged with the new output manager
      expect(outputManager.success).toHaveBeenCalledWith(expect.stringContaining('Task completed: First task'));
      
      // Verify debug log shows git operation skipped
      expect(outputManager.debug).toHaveBeenCalledWith(expect.stringContaining('Git operation skipped'));
      
      // Verify git staging was attempted and failed
      expect(gitOperations.gitStage).toHaveBeenCalled();
    });
  });
});