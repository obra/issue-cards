// ABOUTME: Tests for directory structure utilities
// ABOUTME: Verifies directory creation and validation functions

const fs = require('fs');
const path = require('path');
const { 
  createDirectoryStructure, 
  isInitialized, 
  getIssueDirectoryPath 
} = require('../../src/utils/directory');

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    stat: jest.fn(),
  },
  constants: { F_OK: 0 },
}));

describe('Directory utilities', () => {
  const cwd = process.cwd();
  const issuesDir = path.join(cwd, '.issues');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getIssueDirectoryPath', () => {
    test('returns correct issue directory path', () => {
      expect(getIssueDirectoryPath()).toBe(issuesDir);
    });
    
    test('returns subdirectory when provided', () => {
      expect(getIssueDirectoryPath('open')).toBe(path.join(issuesDir, 'open'));
    });
  });
  
  describe('isInitialized', () => {
    test('returns true when .issues directory exists', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      
      const result = await isInitialized();
      
      expect(result).toBe(true);
      expect(fs.promises.access).toHaveBeenCalledWith(issuesDir, fs.constants.F_OK);
    });
    
    test('returns false when .issues directory does not exist', async () => {
      fs.promises.access.mockRejectedValue(new Error('Directory not found'));
      
      const result = await isInitialized();
      
      expect(result).toBe(false);
      expect(fs.promises.access).toHaveBeenCalledWith(issuesDir, fs.constants.F_OK);
    });
  });
  
  describe('createDirectoryStructure', () => {
    test('creates all required directories', async () => {
      fs.promises.mkdir.mockResolvedValue(undefined);
      
      await createDirectoryStructure();
      
      // Check that each required directory was created
      expect(fs.promises.mkdir).toHaveBeenCalledWith(issuesDir, { recursive: true });
      expect(fs.promises.mkdir).toHaveBeenCalledWith(path.join(issuesDir, 'open'), { recursive: true });
      expect(fs.promises.mkdir).toHaveBeenCalledWith(path.join(issuesDir, 'closed'), { recursive: true });
      expect(fs.promises.mkdir).toHaveBeenCalledWith(path.join(issuesDir, 'config', 'templates', 'issue'), { recursive: true });
      expect(fs.promises.mkdir).toHaveBeenCalledWith(path.join(issuesDir, 'config', 'templates', 'tag'), { recursive: true });
      
      // Make sure mkdir was called 5 times (for the 5 directories)
      expect(fs.promises.mkdir).toHaveBeenCalledTimes(5);
    });
    
    test('throws error if directory creation fails', async () => {
      const error = new Error('Failed to create directory');
      fs.promises.mkdir.mockRejectedValue(error);
      
      await expect(createDirectoryStructure()).rejects.toThrow('Failed to create directory');
    });
  });
});