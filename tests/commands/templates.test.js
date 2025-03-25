// ABOUTME: Tests for the templates command
// ABOUTME: Verifies template listing and display functionality

const { Command } = require('commander');
const directory = require('../../src/utils/directory');
const template = require('../../src/utils/template');
const output = require('../../src/utils/output');

// Mock dependencies
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

jest.mock('../../src/utils/output', () => ({
  formatSuccess: jest.fn(msg => `SUCCESS: ${msg}`),
  formatError: jest.fn(msg => `ERROR: ${msg}`),
  formatInfo: jest.fn(msg => `INFO: ${msg}`),
  formatWarning: jest.fn(msg => `WARNING: ${msg}`),
  formatCommand: jest.fn(cmd => `COMMAND: ${cmd}`),
}));

// Import the module under test
// Note: We need to import after the mocks are set up
const { createCommand, templatesAction } = require('../../src/commands/templates');

describe('Templates command', () => {
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
    // Import the template validation module directly
    const templateValidation = require('../../src/utils/templateValidation');
    
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
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Available issue templates:'));
      mockTemplates.forEach(templateName => {
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining(templateName));
      });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
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
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Available tag templates:'));
      mockTemplates.forEach(templateName => {
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining(templateName));
      });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
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
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Available issue templates:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Available tag templates:'));
      
      [...mockIssueTemplates, ...mockTagTemplates].forEach(templateName => {
        expect(console.log).toHaveBeenCalledWith(expect.stringMatching(new RegExp(templateName)));
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
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Template: feature (issue)'));
      expect(console.log).toHaveBeenCalledWith(mockTemplateContent);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    });
    
    test('shows error when template does not exist', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.validateTemplate to return false
      template.validateTemplate.mockResolvedValue(false);
      
      const options = { type: 'issue', name: 'nonexistent' };
      await templatesAction(options);
      
      // Verify error was displayed
      expect(template.validateTemplate).toHaveBeenCalledWith('nonexistent', 'issue');
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('not found'));
      expect(console.error).toHaveBeenCalled();
      expect(template.loadTemplate).not.toHaveBeenCalled();
    });
    
    test('requires type when template name is specified', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      const options = { name: 'feature' };
      await templatesAction(options);
      
      // Verify error was displayed
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('must specify type'));
      expect(console.error).toHaveBeenCalled();
      expect(template.validateTemplate).not.toHaveBeenCalled();
      expect(template.loadTemplate).not.toHaveBeenCalled();
    });
    
    test('shows error when issue tracking is not initialized', async () => {
      // Mock directory.isInitialized to return false
      directory.isInitialized.mockResolvedValue(false);
      
      await templatesAction({});
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('not initialized'));
      expect(console.error).toHaveBeenCalled();
      expect(template.getTemplateList).not.toHaveBeenCalled();
    });
    
    test('handles errors during template listing', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.getTemplateList to throw error
      template.getTemplateList.mockRejectedValue(new Error('Failed to list templates'));
      
      await templatesAction({});
      
      // Verify error message was logged
      expect(output.formatError).toHaveBeenCalledWith(expect.stringContaining('Failed to list templates'));
      expect(console.error).toHaveBeenCalled();
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
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('structure is valid'));
      expect(console.log).toHaveBeenCalledWith(mockTemplateContent);
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
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Template structure has errors'));
      expect(output.formatWarning).toHaveBeenCalledWith(expect.stringContaining('Missing required section'));
      expect(output.formatWarning).toHaveBeenCalledWith(expect.stringContaining('Missing variable placeholder'));
      expect(console.log).toHaveBeenCalledWith(mockTemplateContent);
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
      expect(output.formatSuccess).toHaveBeenCalledWith('[valid]');
      expect(output.formatError).toHaveBeenCalledWith('[invalid]');
      expect(output.formatWarning).toHaveBeenCalledWith('Missing required section: Tasks');
    });
    
    test('handles errors when validating templates', async () => {
      // Mock directory.isInitialized to return true
      directory.isInitialized.mockResolvedValue(true);
      
      // Mock template.validateTemplate to return true
      template.validateTemplate.mockResolvedValue(true);
      
      // Mock template.loadTemplate to return template content
      const mockTemplateContent = '# Template Content';
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      // Mock templateValidation.validateTemplateStructure to throw error
      templateValidation.validateTemplateStructure.mockRejectedValue(
        new Error('Validation error')
      );
      
      const options = { type: 'issue', name: 'feature', validate: true };
      await templatesAction(options);
      
      // Verify template content is still displayed despite validation error
      expect(templateValidation.validateTemplateStructure).toHaveBeenCalledWith('feature', 'issue');
      // Content is still displayed, but we only check template name was shown
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Template: feature'));
    });
  });
});