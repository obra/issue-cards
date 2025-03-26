// ABOUTME: Tests for the templates command
// ABOUTME: Verifies template listing and display functionality

const { Command } = require('commander');
const { mockOutputManager } = require('../utils/testHelpers');
const { UninitializedError, TemplateNotFoundError, UserError, SystemError } = require('../../src/utils/errors');

// Mock dependencies first
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
}));

jest.mock('../../src/utils/template', () => ({
  getTemplateList: jest.fn(),
  loadTemplate: jest.fn(),
  validateTemplate: jest.fn(),
}));

jest.mock('../../src/utils/templateValidation', () => ({
  validateTemplateStructure: jest.fn(),
}));

// Create mock output manager and then mock it
const mockOutput = mockOutputManager();
jest.mock('../../src/utils/outputManager', () => mockOutput);

// Mock process.exit to prevent tests from exiting
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Import the module under test after mocking
const { createCommand, templatesAction } = require('../../src/commands/templates');
const directory = require('../../src/utils/directory');
const template = require('../../src/utils/template');
const templateValidation = require('../../src/utils/templateValidation');

describe('Templates command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOutput._reset();
  });
  
  describe('createCommand', () => {
    test('creates a properly configured command', () => {
      const command = createCommand();
      
      expect(command.name()).toBe('templates');
      expect(command.description()).toContain('List or view available templates');
      
      // Verify options are set
      const options = command.options;
      expect(options.length).toBe(3);
      
      const typeOption = options.find(opt => opt.long === '--type');
      const nameOption = options.find(opt => opt.long === '--name');
      
      expect(typeOption).toBeDefined();
      expect(typeOption.description).toContain('Template type');
      
      expect(nameOption).toBeDefined();
      expect(nameOption.description).toContain('Template name');
      
      const validateOption = options.find(opt => opt.long === '--validate');
      expect(validateOption).toBeDefined();
      expect(validateOption.description).toContain('Validate');
      
      // Verify action handler is set
      const actionHandler = command._actionHandler;
      expect(typeof actionHandler).toBe('function');
    });
  });
  
  describe('templatesAction', () => {
    test('lists issue templates when type is issue', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.getTemplateList to return template names
      const mockTemplates = ['feature', 'bugfix', 'refactor', 'audit'];
      template.getTemplateList.mockResolvedValue(mockTemplates);
      
      const options = { type: 'issue' };
      await templatesAction(options);
      
      // Verify template list was retrieved and displayed
      expect(template.getTemplateList).toHaveBeenCalledWith('issue');
      expect(mockOutput.section).toHaveBeenCalled();
      
      // Check for each template in the output
      mockTemplates.forEach(templateName => {
        // Find any output entry containing the template name
        const hasTemplate = mockOutput._captured.stdout.some(
          entry => entry.message && entry.message.includes(templateName)
        );
        expect(hasTemplate).toBe(true);
      });
      
      // Verify usage info was displayed - updated to match actual output
      expect(mockOutput.info).toHaveBeenCalledWith(expect.stringContaining('View issue template:'));
      expect(mockOutput.info).toHaveBeenCalledWith(expect.stringContaining('Create new issue from template:'));
    });
    
    test('lists tag templates when type is tag', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.getTemplateList to return template names
      const mockTemplates = ['unit-test', 'e2e-test', 'lint-and-commit', 'update-docs'];
      template.getTemplateList.mockResolvedValue(mockTemplates);
      
      const options = { type: 'tag' };
      await templatesAction(options);
      
      // Verify template list was retrieved and displayed
      expect(template.getTemplateList).toHaveBeenCalledWith('tag');
      expect(mockOutput.section).toHaveBeenCalled();
      
      // Check for each template in the output
      mockTemplates.forEach(templateName => {
        // Find any output entry containing the template name
        const hasTemplate = mockOutput._captured.stdout.some(
          entry => entry.message && entry.message.includes(templateName)
        );
        expect(hasTemplate).toBe(true);
      });
      
      // Verify usage info was displayed - updated to match actual output
      expect(mockOutput.info).toHaveBeenCalledWith(expect.stringContaining('View tag template:'));
      expect(mockOutput.info).toHaveBeenCalledWith(expect.stringContaining('Add task with tag:'));
    });
    
    test('shows both issue and tag templates when no type is specified', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.getTemplateList to return template names for both types
      const mockIssueTemplates = ['feature', 'bugfix', 'refactor', 'audit'];
      const mockTagTemplates = ['unit-test', 'e2e-test', 'lint-and-commit', 'update-docs'];
      
      template.getTemplateList.mockImplementation(type => {
        return Promise.resolve(type === 'issue' ? mockIssueTemplates : mockTagTemplates);
      });
      
      const options = {};
      await templatesAction(options);
      
      // Verify both template lists were retrieved and displayed
      expect(template.getTemplateList).toHaveBeenCalledWith('issue');
      expect(template.getTemplateList).toHaveBeenCalledWith('tag');
      
      // Verify section headings were displayed
      const sectionCalls = mockOutput.section.mock.calls;
      expect(sectionCalls.some(call => call[0] && call[0].includes('issue templates'))).toBe(true);
      expect(sectionCalls.some(call => call[0] && call[0].includes('tag templates'))).toBe(true);
      
      // Check for each template in the output
      [...mockIssueTemplates, ...mockTagTemplates].forEach(templateName => {
        const hasTemplate = mockOutput._captured.stdout.some(
          entry => entry.message && entry.message.includes(templateName)
        );
        expect(hasTemplate).toBe(true);
      });
    });
    
    test('displays template content when name is specified', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.validateTemplate to return true
      template.validateTemplate.mockResolvedValue(true);
      
      // Mock template.loadTemplate to return template content
      const mockTemplateContent = '# Template Content\n\n## Section 1\nContent here\n\n## Section 2\nMore content';
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      const options = { type: 'issue', name: 'feature' };
      await templatesAction(options);
      
      // Verify template content was retrieved and displayed
      expect(template.validateTemplate).toHaveBeenCalledWith('feature', 'issue');
      expect(template.loadTemplate).toHaveBeenCalledWith('feature', 'issue');
      
      // Check for the template heading in the output
      const hasSectionTitle = mockOutput._captured.stdout.some(
        entry => entry.type === 'section' && entry.message && entry.message.includes('Template: feature (issue)')
      );
      expect(hasSectionTitle).toBe(true);
      
      expect(mockOutput.raw).toHaveBeenCalledWith(mockTemplateContent);
      expect(mockOutput.info).toHaveBeenCalledWith(expect.stringContaining('issue-cards create'));
    });
    
    test('throws error when template does not exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.validateTemplate to return false
      template.validateTemplate.mockResolvedValue(false);
      
      const options = { type: 'issue', name: 'nonexistent' };
      
      try {
        await templatesAction(options);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TemplateNotFoundError);
        expect(error.message).toContain('nonexistent (issue)');
        expect(error.displayMessage).toContain('Template not found');
        expect(error.displayMessage).toContain('Run \'issue-cards templates\'');
      }
      
      expect(template.validateTemplate).toHaveBeenCalledWith('nonexistent', 'issue');
      expect(template.loadTemplate).not.toHaveBeenCalled();
    });
    
    test('throws error when template name is specified without type', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      const options = { name: 'feature' };
      
      try {
        await templatesAction(options);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserError);
        expect(error.message).toContain('must specify type');
        expect(error.displayMessage).toContain('must specify type');
        expect(error.displayMessage).toContain('Use --type issue or --type tag');
      }
      
      expect(template.validateTemplate).not.toHaveBeenCalled();
      expect(template.loadTemplate).not.toHaveBeenCalled();
    });
    
    test('throws error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      try {
        await templatesAction({});
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UninitializedError);
        expect(error.displayMessage).toContain('not initialized');
        expect(error.displayMessage).toContain('Run `issue-cards init` first');
      }
      
      expect(template.getTemplateList).not.toHaveBeenCalled();
    });
    
    test('throws wrapped error for errors during template listing', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.getTemplateList to throw error
      template.getTemplateList.mockRejectedValue(new Error('Failed to list templates'));
      
      try {
        await templatesAction({});
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SystemError);
        expect(error.message).toContain('Failed to list templates');
        expect(error.displayMessage).toContain('Failed to list templates');
      }
    });
    
    test('validates template structure when validate option is provided', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.validateTemplate to return true
      template.validateTemplate.mockResolvedValue(true);
      
      // Mock template.loadTemplate to return template content
      const mockTemplateContent = '# Template Content\n\n## Section 1\nContent here\n\n## Section 2\nMore content';
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      // Mock templateValidation.validateTemplateStructure to return valid result
      templateValidation.validateTemplateStructure.mockResolvedValue({
        valid: true,
        errors: []
      });
      
      const options = { type: 'issue', name: 'feature', validate: true };
      await templatesAction(options);
      
      // Verify validation was performed and success message displayed
      expect(templateValidation.validateTemplateStructure).toHaveBeenCalledWith('feature', 'issue');
      expect(mockOutput.success).toHaveBeenCalledWith(expect.stringContaining('structure is valid'));
      expect(mockOutput.raw).toHaveBeenCalledWith(mockTemplateContent);
    });
    
    test('shows validation errors for invalid templates', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.validateTemplate to return true
      template.validateTemplate.mockResolvedValue(true);
      
      // Mock template.loadTemplate to return template content
      const mockTemplateContent = '# Template Content\n\n## Section 1\nContent here';
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      // Mock templateValidation.validateTemplateStructure to return invalid result with errors
      templateValidation.validateTemplateStructure.mockResolvedValue({
        valid: false,
        errors: ['Missing required section: Tasks', 'Missing variable placeholder: {TASKS}']
      });
      
      const options = { type: 'issue', name: 'feature', validate: true };
      await templatesAction(options);
      
      // Verify error messages were displayed
      expect(templateValidation.validateTemplateStructure).toHaveBeenCalledWith('feature', 'issue');
      expect(mockOutput.error).toHaveBeenCalledWith(expect.stringContaining('Template structure has errors'));
      
      // Check for the warning messages in output
      const hasWarnings = mockOutput._captured.stderr.filter(
        entry => entry.type === 'warn' && entry.message && (
          entry.message.includes('Missing required section') || 
          entry.message.includes('Missing variable placeholder')
        )
      );
      expect(hasWarnings.length).toBe(2);
      
      expect(mockOutput.raw).toHaveBeenCalledWith(mockTemplateContent);
    });
    
    test('validates templates when listing with validate option', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.getTemplateList to return template names
      const mockTemplates = ['feature', 'bugfix'];
      template.getTemplateList.mockResolvedValue(mockTemplates);
      
      // Mock validateTemplateStructure to return different results for each template
      templateValidation.validateTemplateStructure.mockImplementation((name) => {
        if (name === 'feature') {
          return Promise.resolve({ valid: true, errors: [] });
        } else {
          return Promise.resolve({ 
            valid: false, 
            errors: ['Missing required section: Tasks'] 
          });
        }
      });
      
      const options = { type: 'issue', validate: true };
      await templatesAction(options);
      
      // Verify validation was performed for each template
      expect(templateValidation.validateTemplateStructure).toHaveBeenCalledWith('feature', 'issue');
      expect(templateValidation.validateTemplateStructure).toHaveBeenCalledWith('bugfix', 'issue');
      
      // Verify validation results were displayed
      expect(mockOutput.success).toHaveBeenCalledWith(expect.stringContaining('feature is valid'));
      expect(mockOutput.error).toHaveBeenCalledWith(expect.stringContaining('bugfix is invalid'));
      
      // Check for warnings
      const hasWarning = mockOutput._captured.stderr.some(
        entry => entry.type === 'warn' && entry.message && entry.message.includes('Missing required section')
      );
      expect(hasWarning).toBe(true);
    });
    
    test('handles errors when validating templates', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.validateTemplate to return true
      template.validateTemplate.mockResolvedValue(true);
      
      // Mock template.loadTemplate to return template content
      const mockTemplateContent = '# Template Content';
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      // Mock validateTemplateStructure to throw error
      templateValidation.validateTemplateStructure.mockRejectedValue(new Error('Validation error'));
      
      try {
        const options = { type: 'issue', name: 'feature', validate: true };
        await templatesAction(options);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserError);
        expect(error.message).toContain('Failed to show template');
        expect(error.displayMessage).toContain('Failed to show template: Validation error');
      }
      
      expect(templateValidation.validateTemplateStructure).toHaveBeenCalledWith('feature', 'issue');
    });
  });
});