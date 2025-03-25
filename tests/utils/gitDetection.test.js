// ABOUTME: Tests for git repository detection utilities
// ABOUTME: Verifies git availability and repository detection functions

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Mock modules
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    stat: jest.fn(),
  },
  constants: { F_OK: 0 },
}));

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Import module to test - we'll create this file next
const { 
  isGitAvailable, 
  isGitRepository,
  getGitRoot
} = require('../../src/utils/gitDetection');

describe('Git Detection utilities', () => {
  const cwd = process.cwd();
  const gitDir = path.join(cwd, '.git');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('isGitAvailable', () => {
    test('returns true when git command exists', () => {
      execSync.mockReturnValue(Buffer.from('git version 2.30.1'));
      
      const result = isGitAvailable();
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith('git --version', { stdio: 'pipe' });
    });
    
    test('returns false when git command fails', () => {
      execSync.mockImplementation(() => {
        throw new Error('git not found');
      });
      
      const result = isGitAvailable();
      
      expect(result).toBe(false);
      expect(execSync).toHaveBeenCalledWith('git --version', { stdio: 'pipe' });
    });
  });
  
  describe('isGitRepository', () => {
    test('returns true when .git directory exists', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      
      const result = await isGitRepository(cwd);
      
      expect(result).toBe(true);
      expect(fs.promises.access).toHaveBeenCalledWith(gitDir, fs.constants.F_OK);
    });
    
    test('returns false when .git directory does not exist', async () => {
      fs.promises.access.mockRejectedValue(new Error('Directory not found'));
      
      const result = await isGitRepository(cwd);
      
      expect(result).toBe(false);
      expect(fs.promises.access).toHaveBeenCalledWith(gitDir, fs.constants.F_OK);
    });
    
    test('checks in parent directories if not found in current directory', async () => {
      // Mock access to fail for current dir but succeed for parent
      const fsAccessMock = jest.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('Not found')))
        .mockImplementationOnce(() => Promise.resolve());
        
      fs.promises.access = fsAccessMock;
      
      const currentDir = path.join(cwd, 'subdir', 'project');
      const parentGitDir = path.join(cwd, 'subdir', '.git');
      
      const result = await isGitRepository(currentDir);
      
      expect(result).toBe(true);
      expect(fs.promises.access).toHaveBeenNthCalledWith(1, path.join(currentDir, '.git'), fs.constants.F_OK);
      expect(fs.promises.access).toHaveBeenNthCalledWith(2, path.join(path.dirname(currentDir), '.git'), fs.constants.F_OK);
    });
    
    test('stops at filesystem root if no git directory found', async () => {
      // Always fail for any path
      fs.promises.access.mockRejectedValue(new Error('Not found'));
      
      const result = await isGitRepository('/some/deep/directory/structure');
      
      expect(result).toBe(false);
      // Should check every parent directory up to the root
      expect(fs.promises.access.mock.calls.length).toBeGreaterThan(1);
    });
  });
  
  describe('getGitRoot', () => {
    test('returns git root directory when found', async () => {
      // Mock access to fail for current dir but succeed for parent
      const fsAccessMock = jest.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('Not found')))
        .mockImplementationOnce(() => Promise.resolve());
        
      fs.promises.access = fsAccessMock;
      
      const currentDir = path.join(cwd, 'subdir', 'project');
      const parentDir = path.join(cwd, 'subdir');
      
      const result = await getGitRoot(currentDir);
      
      expect(result).toBe(parentDir);
      expect(fs.promises.access).toHaveBeenNthCalledWith(1, path.join(currentDir, '.git'), fs.constants.F_OK);
      expect(fs.promises.access).toHaveBeenNthCalledWith(2, path.join(parentDir, '.git'), fs.constants.F_OK);
    });
    
    test('returns null if no git repository found', async () => {
      // Always fail for any path
      fs.promises.access.mockRejectedValue(new Error('Not found'));
      
      const result = await getGitRoot('/some/deep/directory/structure');
      
      expect(result).toBeNull();
      // Should check every parent directory up to the root
      expect(fs.promises.access.mock.calls.length).toBeGreaterThan(1);
    });
    
    test('uses current directory if none provided', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      
      const result = await getGitRoot();
      
      expect(result).toBe(cwd);
      expect(fs.promises.access).toHaveBeenCalledWith(gitDir, fs.constants.F_OK);
    });
  });
});