// ABOUTME: Tests for the create command
// ABOUTME: Verifies issue creation functionality

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { mockOutputManager } = require('../utils/testHelpers');
const { UninitializedError, TemplateNotFoundError, UserError, SystemError } = require('../../src/utils/errors');

// Mock dependencies first
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
}));

// Create mock output manager and then mock it
const mockOutput = mockOutputManager();
jest.mock('../../src/utils/outputManager', () => mockOutput);

// Import the real outputManager for direct spying
const realOutputManager = jest.requireActual('../../src/utils/outputManager');

// Mock process.exit to prevent tests from exiting
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Import the module under test after mocking
const { createCommand, createAction } = require('../../src/commands/create');
const directory = require('../../src/utils/directory');
const template = require('../../src/utils/template');
const issueManager = require('../../src/utils/issueManager');
const gitDetection = require('../../src/utils/gitDetection');
const gitOperations = require('../../src/utils/gitOperations');

describe('Create command', () => {
  let commandInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockOutput._reset();
    
    // Default mocks
    directory.isInitialized.mockResolvedValue(true);
    directory.getIssueDirectoryPath.mockImplementation(type => `/project/.issues/${type}`);
    issueManager.getNextIssueNumber.mockResolvedValue('0001');
    template.validateTemplate.mockResolvedValue(true);
    
    // Mock a full feature template with all sections
    template.loadTemplate.mockResolvedValue(
      '# Issue {{NUMBER}}: {{TITLE}}\n\n' +
      '## Problem to be solved\n{{PROBLEM}}\n\n' +
      '## Planned approach\n{{APPROACH}}\n\n' +
      '## Failed approaches\n{{FAILED_APPROACHES}}\n\n' +
      '## Questions to resolve\n{{QUESTIONS}}\n\n' +
      '## Tasks\n{{TASKS}}\n\n' +
      '## Instructions\n{{INSTRUCTIONS}}\n\n' +
      '## Next steps\n{{NEXT_STEPS}}'
    );
    
    // Mock template renderer to replace placeholders
    template.renderTemplate.mockImplementation((content, data) => {
      let result = content;
      
      result = result.replace(/{{NUMBER}}/g, data.NUMBER || '')
                    .replace(/{{TITLE}}/g, data.TITLE || '')
                    .replace(/{{PROBLEM}}/g, data.PROBLEM || '')
                    .replace(/{{APPROACH}}/g, data.APPROACH || '')
                    .replace(/{{FAILED_APPROACHES}}/g, data.FAILED_APPROACHES || '')
                    .replace(/{{QUESTIONS}}/g, data.QUESTIONS || '')
                    .replace(/{{TASKS}}/g, data.TASKS || '')
                    .replace(/{{INSTRUCTIONS}}/g, data.INSTRUCTIONS || '')
                    .replace(/{{NEXT_STEPS}}/g, data.NEXT_STEPS || '');
                    
      return result;
    });
    
    issueManager.saveIssue.mockImplementation((number, content) => {
      return Promise.resolve(`/project/.issues/open/issue-${number}.md`);
    });
  });
  
  describe('createCommand', () => {
    test('creates a properly configured command', () => {
      const command = createCommand();
      
      expect(command.name()).toBe('create');
      expect(command.description()).toContain('Create a new issue');
      
      // Verify options are set
      const options = command.options;
      expect(options.length).toBeGreaterThan(0);
      
      const titleOption = options.find(opt => opt.long === '--title');
      const taskOption = options.find(opt => opt.long === '--task');
      
      expect(titleOption).toBeDefined();
      expect(titleOption.description).toContain('Issue title');
      
      expect(taskOption).toBeDefined();
      expect(taskOption.description).toContain('task');
    });
  });
  
  describe('createAction', () => {
    test('creates issue from valid template with title', async () => {
      // Set up the template name and options
      const templateName = 'feature';
      const options = {
        title: 'Test Issue'
      };
      
      await createAction(templateName, options);
      
      // Verify template was loaded and rendered
      expect(template.validateTemplate).toHaveBeenCalledWith(templateName, 'issue');
      expect(template.loadTemplate).toHaveBeenCalledWith(templateName, 'issue');
      
      // Verify the rendered template had correct data
      expect(template.renderTemplate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ 
          NUMBER: '0001',
          TITLE: 'Test Issue'
        })
      );
      
      // Verify issue was saved
      expect(issueManager.saveIssue).toHaveBeenCalledWith(
        '0001',
        expect.any(String)
      );
      
      // Verify success messages was logged
      const successMessages = mockOutput._captured.stdout.filter(
        entry => entry.type === 'success'
      );
      expect(successMessages.length).toBeGreaterThan(1);
      expect(mockOutput.success).toHaveBeenCalledWith(expect.stringContaining('Created Issue #0001'));
      
      // Verify git staging was attempted
      expect(gitOperations.gitStage).toHaveBeenCalledWith('/project/.issues/open/issue-0001.md');
    });
    
    test('throws error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      const templateName = 'feature';
      const options = {
        title: 'Test Issue'
      };
      
      try {
        await createAction(templateName, options);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UninitializedError);
        expect(error.displayMessage).toContain('not initialized');
      }
      
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('throws error when template is invalid', async () => {
      // Mock template validation to fail
      template.validateTemplate.mockResolvedValue(false);
      
      const templateName = 'invalid-template';
      const options = {
        title: 'Test Issue'
      };
      
      try {
        await createAction(templateName, options);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TemplateNotFoundError);
        expect(error.displayMessage).toContain('Template not found');
      }
      
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('throws error when title is missing', async () => {
      const templateName = 'feature';
      const options = {
        // No title provided
      };
      
      try {
        await createAction(templateName, options);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserError);
        expect(error.displayMessage).toContain('title is required');
      }
      
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('creates issue with all optional sections', async () => {
      const templateName = 'feature';
      const options = {
        title: 'Test Issue',
        problem: 'Test problem description',
        approach: 'Test planned approach',
        task: ['Task 1', 'Task 2', 'Task 3'],
        failedApproaches: 'Failed approach 1\nFailed approach 2',
        questions: 'Question 1?\nQuestion 2?',
        instructions: 'Step 1\nStep 2',
        nextSteps: 'Next step 1\nNext step 2',
      };
      
      await createAction(templateName, options);
      
      // Verify template was loaded and rendered
      expect(template.validateTemplate).toHaveBeenCalledWith(templateName, 'issue');
      expect(template.loadTemplate).toHaveBeenCalledWith(templateName, 'issue');
      
      // Verify template data contains all options
      expect(template.renderTemplate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          NUMBER: '0001',
          TITLE: 'Test Issue',
          PROBLEM: 'Test problem description',
          APPROACH: 'Test planned approach'
        })
      );
      
      // Verify lists were formatted correctly
      const templateData = template.renderTemplate.mock.calls[0][1];
      expect(templateData.TASKS).toContain('- [ ] Task 1');
      expect(templateData.TASKS).toContain('- [ ] Task 2');
      expect(templateData.FAILED_APPROACHES).toContain('- Failed approach 1');
      expect(templateData.QUESTIONS).toContain('- Question 1?');
      expect(templateData.NEXT_STEPS).toContain('- Next step 1');
      
      // Verify issue was saved
      expect(issueManager.saveIssue).toHaveBeenCalledWith(
        '0001',
        expect.any(String)
      );
      
      // Verify success message was logged
      expect(mockOutput.success).toHaveBeenCalledWith(expect.stringContaining('Created Issue #0001'));
      expect(mockOutput._captured.stdout.length).toBeGreaterThan(0);
      
      // Verify git staging was attempted
      expect(gitOperations.gitStage).toHaveBeenCalledWith('/project/.issues/open/issue-0001.md');
    });
    
    test('wraps and throws system errors during issue creation', async () => {
      // Mock loadTemplate to throw error
      template.loadTemplate.mockRejectedValue(new Error('Failed to load template'));
      
      const templateName = 'feature';
      const options = {
        title: 'Test Issue'
      };
      
      try {
        await createAction(templateName, options);
        // If we get here, the test should fail because an error should have been thrown
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SystemError);
        expect(error.message).toContain('Failed to create issue');
        expect(error.displayMessage).toContain('Failed to create issue');
      }
      
      expect(issueManager.saveIssue).not.toHaveBeenCalled();
    });
    
    test('skips git staging if git is not available', async () => {
      // Mock git not available
      gitDetection.isGitAvailable.mockReturnValue(false);
      
      const templateName = 'feature';
      const options = {
        title: 'Test Issue'
      };
      
      await createAction(templateName, options);
      
      // Verify success message was logged
      expect(mockOutput.success).toHaveBeenCalledWith(expect.stringContaining('Created Issue #0001'));
      expect(mockOutput._captured.stdout.length).toBeGreaterThan(0);
      
      // Verify git staging was not attempted
      expect(gitOperations.gitStage).not.toHaveBeenCalled();
    });
    
    test('handles git staging errors gracefully', async () => {
      // Mock git staging to throw error
      gitOperations.gitStage.mockRejectedValue(new Error('Git error'));
      
      const templateName = 'feature';
      const options = {
        title: 'Test Issue'
      };
      
      await createAction(templateName, options);
      
      // Verify success message for issue creation was logged
      expect(mockOutput.success).toHaveBeenCalledWith(expect.stringContaining('Created Issue #0001'));
      expect(mockOutput._captured.stdout.length).toBeGreaterThan(0);
      
      // Since the debug level output depends on verbosity, we don't test for
      // the debug method call, but verify the issue was still created successfully
      // This confirms the git error was handled gracefully without affecting the main functionality
      expect(issueManager.saveIssue).toHaveBeenCalledWith('0001', expect.any(String));
    });
  });
});