// ABOUTME: Tests for template loading and rendering utilities
// ABOUTME: Verifies template handling functionality

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { 
  loadTemplate, 
  renderTemplate,
  getTemplatePath,
  getTemplateList,
  validateTemplate 
} = require('../../src/utils/template');
const directory = require('../../src/utils/directory');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
    access: jest.fn(),
  },
  constants: { F_OK: 0 },
}));

jest.mock('handlebars', () => ({
  compile: jest.fn(),
  registerHelper: jest.fn(),
}));

jest.mock('../../src/utils/directory', () => ({
  getIssueDirectoryPath: jest.fn(),
}));

describe('Template utilities', () => {
  const templatesDir = '/project/.issues/config/templates';
  const issueTemplateDir = path.join(templatesDir, 'issue');
  const tagTemplateDir = path.join(templatesDir, 'tag');
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock directory.getIssueDirectoryPath
    directory.getIssueDirectoryPath.mockImplementation((subdir) => {
      if (subdir === 'config/templates') return templatesDir;
      if (subdir === 'config/templates/issue') return issueTemplateDir;
      if (subdir === 'config/templates/tag') return tagTemplateDir;
      return '/project/.issues';
    });
  });
  
  describe('getTemplatePath', () => {
    test('returns correct path for issue templates', () => {
      const result = getTemplatePath('feature', 'issue');
      expect(result).toBe(path.join(issueTemplateDir, 'feature.md'));
    });
    
    test('returns correct path for tag templates', () => {
      const result = getTemplatePath('unit-test', 'tag');
      expect(result).toBe(path.join(tagTemplateDir, 'unit-test.md'));
    });
    
    test('throws error for invalid template type', () => {
      expect(() => getTemplatePath('feature', 'invalid')).toThrow('Invalid template type');
    });
  });
  
  describe('loadTemplate', () => {
    test('loads template file content', async () => {
      const mockTemplateContent = '# Template content';
      fs.promises.readFile.mockResolvedValue(mockTemplateContent);
      
      const result = await loadTemplate('feature', 'issue');
      
      expect(result).toBe(mockTemplateContent);
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        path.join(issueTemplateDir, 'feature.md'),
        'utf8'
      );
    });
    
    test('throws error when template file does not exist', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(loadTemplate('nonexistent', 'issue')).rejects.toThrow('Template not found');
    });
  });
  
  describe('renderTemplate', () => {
    test('renders template with data', () => {
      const mockTemplate = '# Issue {{number}}: {{title}}';
      const mockCompiledTemplate = jest.fn().mockReturnValue('# Issue 1: Test Issue');
      Handlebars.compile.mockReturnValue(mockCompiledTemplate);
      
      const data = { number: 1, title: 'Test Issue' };
      const result = renderTemplate(mockTemplate, data);
      
      expect(result).toBe('# Issue 1: Test Issue');
      expect(Handlebars.compile).toHaveBeenCalledWith(mockTemplate);
      expect(mockCompiledTemplate).toHaveBeenCalledWith(data);
    });
  });
  
  describe('getTemplateList', () => {
    test('returns list of templates for specified type', async () => {
      const mockFiles = ['feature.md', 'bugfix.md', 'refactor.md', 'audit.md'];
      fs.promises.readdir.mockResolvedValue(mockFiles);
      
      const result = await getTemplateList('issue');
      
      expect(result).toEqual(['feature', 'bugfix', 'refactor', 'audit']);
      expect(fs.promises.readdir).toHaveBeenCalledWith(issueTemplateDir);
    });
    
    test('returns empty array when no templates found', async () => {
      fs.promises.readdir.mockResolvedValue([]);
      
      const result = await getTemplateList('tag');
      
      expect(result).toEqual([]);
      expect(fs.promises.readdir).toHaveBeenCalledWith(tagTemplateDir);
    });
    
    test('throws error for invalid template type', async () => {
      await expect(getTemplateList('invalid')).rejects.toThrow('Invalid template type');
    });
  });
  
  describe('validateTemplate', () => {
    test('returns true for valid template', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      
      const result = await validateTemplate('feature', 'issue');
      
      expect(result).toBe(true);
      expect(fs.promises.access).toHaveBeenCalledWith(
        path.join(issueTemplateDir, 'feature.md'),
        fs.constants.F_OK
      );
    });
    
    test('returns false for non-existent template', async () => {
      fs.promises.access.mockRejectedValue(new Error('File not found'));
      
      const result = await validateTemplate('nonexistent', 'issue');
      
      expect(result).toBe(false);
    });
  });
});