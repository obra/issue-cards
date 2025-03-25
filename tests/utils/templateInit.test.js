// ABOUTME: Tests for template initialization and copying
// ABOUTME: Verifies template setup during initialization

const fs = require('fs');
const path = require('path');
const { 
  copyDefaultTemplates, 
  getDefaultTemplatesDir,
  getDefaultTemplatePath
} = require('../../src/utils/templateInit');
const directory = require('../../src/utils/directory');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    copyFile: jest.fn(),
  },
  existsSync: jest.fn().mockReturnValue(true),
  readdirSync: jest.fn().mockReturnValue(['issue', 'tag']),
}));

jest.mock('../../src/utils/directory', () => ({
  getIssueDirectoryPath: jest.fn(),
}));

describe('Template initialization utilities', () => {
  const defaultTemplatesDir = path.join(__dirname, '../../templates');
  const projectTemplatesDir = '/project/.issues/config/templates';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock directory.getIssueDirectoryPath
    directory.getIssueDirectoryPath.mockImplementation((subdir) => {
      if (subdir === 'config/templates') return projectTemplatesDir;
      if (subdir === 'config/templates/issue') return path.join(projectTemplatesDir, 'issue');
      if (subdir === 'config/templates/tag') return path.join(projectTemplatesDir, 'tag');
      return '/project/.issues';
    });
  });
  
  describe('getDefaultTemplatesDir', () => {
    test('returns the default templates directory path', () => {
      const result = getDefaultTemplatesDir();
      expect(result).toContain('templates');
      expect(path.isAbsolute(result)).toBe(true);
    });
  });
  
  describe('getDefaultTemplatePath', () => {
    test('returns correct path for issue templates', () => {
      const result = getDefaultTemplatePath('feature', 'issue');
      expect(result).toBe(path.join(defaultTemplatesDir, 'issue', 'feature.md'));
    });
    
    test('returns correct path for tag templates', () => {
      const result = getDefaultTemplatePath('unit-test', 'tag');
      expect(result).toBe(path.join(defaultTemplatesDir, 'tag', 'unit-test.md'));
    });
    
    test('throws error for invalid template type', () => {
      expect(() => getDefaultTemplatePath('feature', 'invalid')).toThrow('Invalid template type');
    });
  });
  
  describe('copyDefaultTemplates', () => {
    test('copies all default templates to project directory', async () => {
      // Mock readdir to return template files
      fs.promises.readdir.mockImplementation((dir) => {
        if (dir.endsWith('issue')) {
          return Promise.resolve(['feature.md', 'bugfix.md', 'refactor.md', 'audit.md']);
        }
        if (dir.endsWith('tag')) {
          return Promise.resolve(['unit-test.md', 'e2e-test.md', 'lint-and-commit.md', 'update-docs.md']);
        }
        return Promise.resolve([]);
      });
      
      // Mock readFile to return template content
      fs.promises.readFile.mockResolvedValue('# Template content');
      
      await copyDefaultTemplates();
      
      // Verify issue templates were copied
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(projectTemplatesDir, 'issue', 'feature.md'),
        '# Template content',
        'utf8'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(projectTemplatesDir, 'issue', 'bugfix.md'),
        '# Template content',
        'utf8'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(projectTemplatesDir, 'issue', 'refactor.md'),
        '# Template content',
        'utf8'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(projectTemplatesDir, 'issue', 'audit.md'),
        '# Template content',
        'utf8'
      );
      
      // Verify tag templates were copied
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(projectTemplatesDir, 'tag', 'unit-test.md'),
        '# Template content',
        'utf8'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(projectTemplatesDir, 'tag', 'e2e-test.md'),
        '# Template content',
        'utf8'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(projectTemplatesDir, 'tag', 'lint-and-commit.md'),
        '# Template content',
        'utf8'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(projectTemplatesDir, 'tag', 'update-docs.md'),
        '# Template content',
        'utf8'
      );
      
      // Should have been called 8 times (4 issue templates + 4 tag templates)
      expect(fs.promises.writeFile).toHaveBeenCalledTimes(8);
    });
    
    test('handles case when default templates are not found', async () => {
      // Mock readdir to return no files
      fs.promises.readdir.mockResolvedValue([]);
      
      await copyDefaultTemplates();
      
      // No templates should be copied
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });
    
    test('handles errors when reading templates', async () => {
      // Mock readdir to throw error
      fs.promises.readdir.mockRejectedValue(new Error('Failed to read directory'));
      
      await expect(copyDefaultTemplates()).rejects.toThrow('Failed to copy default templates');
    });
  });
});