// ABOUTME: Tests for the current command
// ABOUTME: Verifies current task display functionality

const { Command } = require('commander');
const { createCommand, currentAction } = require('../../src/commands/current');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const taskParser = require('../../src/utils/taskParser');
const taskExpander = require('../../src/utils/taskExpander');
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
  getIssue: jest.fn(),
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
    outputManager._reset();
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
      
      // Check section output
      expect(outputManager.section).toHaveBeenCalledWith('TASK', 'First task');
      expect(outputManager.section).toHaveBeenCalledWith('CURRENT TASK', 'First task');
      expect(outputManager.section).toHaveBeenCalledWith('TASKS', expandedSteps.map((step, idx) => `${idx + 1}. ${step}`));
      expect(outputManager.section).toHaveBeenCalledWith('NEXT TASK', 'Second task');
      
      // Verify the output manager recorded the outputs
      const sectionCalls = outputManager._captured.stdout.filter(entry => entry.type === 'section');
      expect(sectionCalls.length).toBeGreaterThanOrEqual(3);
      
      // Check for specific content
      const sectionTexts = sectionCalls.map(call => call.message);
      expect(sectionTexts.some(text => text.includes('TASK'))).toBe(true);
      expect(sectionTexts.some(text => text.includes('First task'))).toBe(true);
      expect(sectionTexts.some(text => text.includes('NEXT TASK'))).toBe(true);
      expect(sectionTexts.some(text => text.includes('Second task'))).toBe(true);
    });
    
    test('shows error when no open issues exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock issueManager.listIssues to return empty list
      issueManager.listIssues.mockResolvedValue([]);
      
      await currentAction();
      
      // Verify error message was logged
      expect(outputManager.error).toHaveBeenCalledWith(expect.stringContaining('No open issues'));
      
      // Verify the error is in the captured stderr
      const errorCalls = outputManager._captured.stderr.filter(entry => entry.type === 'error');
      expect(errorCalls.length).toBe(1);
      expect(errorCalls[0].message).toContain('No open issues');
    });
    
    test('shows success when all tasks are completed', async () => {
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
      expect(outputManager.success).toHaveBeenCalledWith(expect.stringContaining('All tasks completed'));
      
      // Verify the success message is in the captured stdout
      const successCalls = outputManager._captured.stdout.filter(entry => entry.type === 'success');
      expect(successCalls.length).toBe(1);
      expect(successCalls[0].message).toContain('All tasks completed');
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await currentAction();
      
      // Verify error message was logged using the new UninitializedError
      expect(outputManager.error).toHaveBeenCalledWith('Issue tracking is not initialized', expect.anything());
      
      // Verify the error message is in the captured stderr
      const errorCalls = outputManager._captured.stderr.filter(entry => entry.type === 'error');
      expect(errorCalls.length).toBe(1);
      expect(errorCalls[0].message).toContain('Issue tracking is not initialized');
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
      
      // Verify context sections were output
      expect(outputManager.section).toHaveBeenCalledWith('Problem to be solved', 'This is a test problem.');
      expect(outputManager.section).toHaveBeenCalledWith('Failed approaches', ['Failed approach 1', 'Failed approach 2']);
      expect(outputManager.section).toHaveBeenCalledWith('Instructions', 'Follow these instructions.');
      
      // Check that all necessary sections were output
      const sectionCalls = outputManager._captured.stdout.filter(entry => entry.type === 'section');
      const sectionTitles = sectionCalls.map(call => call.message);
      
      expect(sectionTitles.some(title => title.includes('Problem to be solved'))).toBe(true);
      expect(sectionTitles.some(title => title.includes('Failed approaches'))).toBe(true);
      expect(sectionTitles.some(title => title.includes('Instructions'))).toBe(true);
    });
  });
});