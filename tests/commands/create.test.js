// ABOUTME: Tests for the create command
// ABOUTME: Verifies issue creation functionality

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { createCommand, createAction } = require('../../src/commands/create');
const directory = require('../../src/utils/directory');
const template = require('../../src/utils/template');
const issueManager = require('../../src/utils/issueManager');
const output = require('../../src/utils/output');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readdir: jest.fn(),
  },
}));

jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
  getIssueDirectoryPath: jest.fn(),
}));

jest.mock('../../src/utils/template', () => ({
  loadTemplate: jest.fn(),
  renderTemplate: jest.fn(),
  validateTemplate: jest.fn(),
}));

jest.mock('../../src/utils/issueManager', () => ({
  getNextIssueNumber: jest.fn(),
  saveIssue: jest.fn(),
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

describe('Create command', () => {
  let commandInstance;
  let mockConsoleLog;
  let mockConsoleError;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Set up mock implementation for directory.getIssueDirectoryPath
    directory.getIssueDirectoryPath.mockImplementation((subdir) => {
      if (subdir === 'open') return '/project/.issues/open';
      if (subdir === 'config/templates/issue') return '/project/.issues/config/templates/issue';
      return '/project/.issues';
    });
    
    // Mock issueManager.getNextIssueNumber
    issueManager.getNextIssueNumber.mockResolvedValue('0001');
    
    // Mock template validation
    template.validateTemplate.mockResolvedValue(true);
  });
  
  afterEach(() => {
    // Restore console mocks
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });
  
  describe('createCommand', () => {
    test('creates a properly configured command', () => {
      const command = createCommand();
      
      expect(command.name()).toBe('create');
      expect(command.description()).toContain('Create a new issue');
      
      // Verify command has expected options
      const options = command.options;
      expect(options.some(opt => opt.flags.includes('--title'))).toBe(true);
      expect(options.some(opt => opt.flags.includes('--problem'))).toBe(true);
      expect(options.some(opt => opt.flags.includes('--approach'))).toBe(true);
      expect(options.some(opt => opt.flags.includes('--task'))).toBe(true);
      expect(options.some(opt => opt.flags.includes('--instructions'))).toBe(true);
      
      // Verify action handler is set
      const actionHandler = command._actionHandler;
      expect(typeof actionHandler).toBe('function');
    });
  });
  
  describe('createAction', () => {
    test('creates issue from valid template with title', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.loadTemplate to return template content
      const mockTemplateContent = '# Issue {{NUMBER}}: {{TITLE}}\n\n## Problem to be solved\n{{PROBLEM}}\n\n## Tasks\n{{TASKS}}';
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      // Mock template.renderTemplate to return rendered content
      const mockRenderedContent = '# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2';
      template.renderTemplate.mockReturnValue(mockRenderedContent);
      
      // Call create action with required parameters
      await createAction('feature', { title: 'Test Issue', problem: 'Test problem', task: ['Task 1', 'Task 2'] });
      
      // Verify issue was saved
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', mockRenderedContent);
      
      // Verify success message was logged
      expect(output.formatSuccess).toHaveBeenCalledWith(expect.stringContaining('Created Issue #0001'));
      expect(console.log).toHaveBeenCalled();
      
      // Verify git staging was attempted
      expect(gitOperations.gitStage).toHaveBeenCalledWith('/project/.issues/open/issue-0001.md');
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      // Call create action
      await createAction('feature', { title: 'Test Issue' });
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('not initialized'));
      expect(console.error).toHaveBeenCalled();
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('shows error when template is invalid', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.validateTemplate to return false
      template.validateTemplate.mockResolvedValue(false);
      
      // Call create action with invalid template
      await createAction('invalid-template', { title: 'Test Issue' });
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('Template not found'));
      expect(console.error).toHaveBeenCalled();
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('shows error when title is missing', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Call create action without title
      await createAction('feature', {});
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('title is required'));
      expect(console.error).toHaveBeenCalled();
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('creates issue with all optional sections', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.loadTemplate to return template with all sections
      const mockTemplateContent = '# Issue {{NUMBER}}: {{TITLE}}\n\n## Problem to be solved\n{{PROBLEM}}\n\n## Planned approach\n{{APPROACH}}\n\n## Failed approaches\n{{FAILED_APPROACHES}}\n\n## Questions to resolve\n{{QUESTIONS}}\n\n## Tasks\n{{TASKS}}\n\n## Instructions\n{{INSTRUCTIONS}}\n\n## Next steps\n{{NEXT_STEPS}}';
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      // Mock template.renderTemplate to return rendered content
      const mockRenderedContent = '# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Planned approach\nTest approach\n\n## Failed approaches\n- Failed approach 1\n- Failed approach 2\n\n## Questions to resolve\n- Question 1\n- Question 2\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2\n\n## Instructions\nTest instructions\n\n## Next steps\n- Next step 1\n- Next step 2';
      template.renderTemplate.mockReturnValue(mockRenderedContent);
      
      // Call create action with all sections
      await createAction('feature', {
        title: 'Test Issue',
        problem: 'Test problem',
        approach: 'Test approach',
        failedApproaches: 'Failed approach 1\nFailed approach 2',
        questions: 'Question 1\nQuestion 2',
        task: ['Task 1', 'Task 2'],
        instructions: 'Test instructions',
        nextSteps: 'Next step 1\nNext step 2'
      });
      
      // Verify template was rendered with all data
      expect(template.renderTemplate).toHaveBeenCalledWith(mockTemplateContent, {
        NUMBER: '0001',
        TITLE: 'Test Issue',
        PROBLEM: 'Test problem',
        APPROACH: 'Test approach',
        FAILED_APPROACHES: '- Failed approach 1\n- Failed approach 2',
        QUESTIONS: '- Question 1\n- Question 2',
        TASKS: '- [ ] Task 1\n- [ ] Task 2',
        INSTRUCTIONS: 'Test instructions',
        NEXT_STEPS: '- Next step 1\n- Next step 2'
      });
      
      // Verify issue was saved
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', mockRenderedContent);
      
      // Verify success message was logged
      expect(output.formatSuccess).toHaveBeenCalledWith(expect.stringContaining('Created Issue #0001'));
      expect(console.log).toHaveBeenCalled();
      
      // Verify git staging was attempted
      expect(gitOperations.gitStage).toHaveBeenCalledWith('/project/.issues/open/issue-0001.md');
    });
    
    test('handles errors during issue creation', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.loadTemplate to throw an error
      template.loadTemplate.mockRejectedValue(new Error('Failed to load template'));
      
      // Call create action
      await createAction('feature', { title: 'Test Issue' });
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('Failed to create issue'));
      expect(console.error).toHaveBeenCalled();
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('skips git staging if git is not available', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.loadTemplate to return template content
      const mockTemplateContent = '# Issue {{NUMBER}}: {{TITLE}}\n\n## Tasks\n{{TASKS}}';
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      // Mock template.renderTemplate to return rendered content
      const mockRenderedContent = '# Issue 0001: Test Issue\n\n## Tasks\n- [ ] Task 1';
      template.renderTemplate.mockReturnValue(mockRenderedContent);
      
      // Mock git not available
      gitDetection.isGitAvailable.mockReturnValue(false);
      
      // Call create action with required parameters
      await createAction('feature', { title: 'Test Issue', tasks: 'Task 1' });
      
      // Verify issue was saved
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', mockRenderedContent);
      
      // Verify success message was logged
      expect(output.formatSuccess).toHaveBeenCalledWith(expect.stringContaining('Created Issue #0001'));
      expect(console.log).toHaveBeenCalled();
      
      // Verify git staging was not attempted
      expect(gitOperations.gitStage).not.toHaveBeenCalled();
    });
  });
});