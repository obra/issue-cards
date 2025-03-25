// ABOUTME: Tests for the current command
// ABOUTME: Verifies current task display functionality

const { Command } = require('commander');
const { createCommand, currentAction } = require('../../src/commands/current');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const taskParser = require('../../src/utils/taskParser');
const taskExpander = require('../../src/utils/taskExpander');
const output = require('../../src/utils/output');

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  listIssues: jest.fn(),
  getIssue: jest.fn(),
}));

jest.mock('../../src/utils/taskParser', () => ({
  extractTasks: jest.fn(),
  findCurrentTask: jest.fn(),
}));

jest.mock('../../src/utils/taskExpander', () => ({
  expandTask: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  formatCommand: jest.fn(cmd => `COMMAND: ${cmd}`),
  formatTask: jest.fn(task => `TASK: ${task}`),
  formatContext: jest.fn(() => 'CONTEXT: ...\n'),
  formatSection: jest.fn((title, content) => `${title}:\n${Array.isArray(content) ? content.join('\n') : content}\n`),
  formatSuccess: jest.fn(msg => `SUCCESS: ${msg}`),
  formatError: jest.fn(msg => `ERROR: ${msg}`),
}));

describe('Current command', () => {
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
      
      // Check console output
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('COMMAND: issue-cards current'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('TASK: First task'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('TASKS:'));
      
      // Verify task info is shown
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('CURRENT TASK:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('NEXT TASK:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Second task'));
    });
    
    test('shows error when no open issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      await currentAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('No open issues'));
      expect(console.error).toHaveBeenCalled();
    });
    
    test('shows error when all tasks are completed', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return issues
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Test Issue', content: '# Issue 0001: Test Issue' }
      ]);
      
      // Mock taskParser.extractTasks to return completed tasks
      const tasks = [
        { text: 'First task', completed: true, index: 0 },
        { text: 'Second task', completed: true, index: 1 }
      ];
      taskParser.extractTasks.mockResolvedValue(tasks);
      
      // Mock taskParser.findCurrentTask to return null (all tasks completed)
      taskParser.findCurrentTask.mockReturnValue(null);
      
      await currentAction();
      
      // Verify completion message was logged
      expect(output.formatSuccess).toHaveBeenCalledWith(expect.stringContaining('All tasks completed'));
      expect(console.log).toHaveBeenCalled();
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await currentAction();
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('not initialized'));
      expect(console.error).toHaveBeenCalled();
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
      
      // Verify context was formatted - using a more flexible expect with objectContaining
      expect(output.formatContext).toHaveBeenCalledWith(expect.objectContaining({
        problem: 'This is a test problem.',
        failed: expect.arrayContaining(['Failed approach 1', 'Failed approach 2']),
        instructions: 'Follow these instructions.'
      }));
      
      // Check context output was included
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('CONTEXT:'));
    });
  });
});