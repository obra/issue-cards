// ABOUTME: Tests for git operations utilities
// ABOUTME: Verifies safe git command execution and error handling

const path = require('path');
const { execSync } = require('child_process');

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Import modules to test
const { isGitAvailable } = require('../../src/utils/gitDetection');
const { 
  gitStage,
  gitStatus,
  gitShowTrackedFiles,
  safelyExecuteGit
} = require('../../src/utils/gitOperations');

// Mock gitDetection module
jest.mock('../../src/utils/gitDetection', () => ({
  isGitAvailable: jest.fn(),
  isGitRepository: jest.fn(),
  getGitRoot: jest.fn(),
}));

describe('Git Operations utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isGitAvailable.mockReturnValue(true);
  });

  describe('safelyExecuteGit', () => {
    test('executes git command when git is available', async () => {
      execSync.mockReturnValue(Buffer.from('command output'));
      
      const result = await safelyExecuteGit('status');
      
      expect(result).toBe('command output');
      expect(execSync).toHaveBeenCalledWith('git status', { encoding: 'utf8' });
      expect(isGitAvailable).toHaveBeenCalled();
    });
    
    test('throws error when git is not available', async () => {
      isGitAvailable.mockReturnValue(false);
      
      await expect(safelyExecuteGit('status')).rejects.toThrow('Git is not available on this system');
      expect(execSync).not.toHaveBeenCalled();
    });
    
    test('handles git command errors', async () => {
      const errorMessage = 'fatal: not a git repository';
      execSync.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      await expect(safelyExecuteGit('status')).rejects.toThrow(errorMessage);
      expect(execSync).toHaveBeenCalledWith('git status', { encoding: 'utf8' });
    });
    
    test('allows specifying working directory', async () => {
      execSync.mockReturnValue(Buffer.from('command output'));
      const workingDir = '/path/to/repo';
      
      const result = await safelyExecuteGit('status', [], { cwd: workingDir });
      
      expect(execSync).toHaveBeenCalledWith('git status', { 
        encoding: 'utf8',
        cwd: workingDir 
      });
    });
    
    test('properly formats command with arguments', async () => {
      execSync.mockReturnValue(Buffer.from('command output'));
      
      await safelyExecuteGit('add', ['-A', 'file.txt']);
      
      expect(execSync).toHaveBeenCalledWith('git add -A file.txt', { encoding: 'utf8' });
    });
  });
  
  describe('gitStatus', () => {
    test('returns git status output', async () => {
      const statusOutput = 'On branch main\nnothing to commit, working tree clean';
      execSync.mockReturnValue(Buffer.from(statusOutput));
      
      const result = await gitStatus();
      
      expect(result).toBe(statusOutput);
      expect(execSync).toHaveBeenCalledWith('git status', { encoding: 'utf8' });
    });
  });
  
  describe('gitStage', () => {
    test('stages specified file', async () => {
      execSync.mockReturnValue(Buffer.from(''));
      const filePath = 'path/to/file.md';
      
      await gitStage(filePath);
      
      expect(execSync).toHaveBeenCalledWith(`git add "${filePath}"`, { encoding: 'utf8' });
    });
    
    test('stages multiple files when array is passed', async () => {
      execSync.mockReturnValue(Buffer.from(''));
      const filePaths = ['file1.txt', 'file2.md'];
      
      await gitStage(filePaths);
      
      expect(execSync).toHaveBeenCalledWith('git add "file1.txt" "file2.md"', { encoding: 'utf8' });
    });
    
    test('stages all files when no path is specified', async () => {
      execSync.mockReturnValue(Buffer.from(''));
      
      await gitStage();
      
      expect(execSync).toHaveBeenCalledWith('git add -A', { encoding: 'utf8' });
    });
  });
  
  describe('gitShowTrackedFiles', () => {
    test('returns list of tracked files', async () => {
      const lsFilesOutput = 'file1.txt\nfile2.md\ndir/file3.js';
      execSync.mockReturnValue(Buffer.from(lsFilesOutput));
      
      const result = await gitShowTrackedFiles();
      
      expect(result).toEqual(['file1.txt', 'file2.md', 'dir/file3.js']);
      expect(execSync).toHaveBeenCalledWith('git ls-files', { encoding: 'utf8' });
    });
    
    test('filters files by pattern when specified', async () => {
      const lsFilesOutput = 'file1.txt\nfile2.md\ndir/file3.js';
      execSync.mockReturnValue(Buffer.from(lsFilesOutput));
      
      const result = await gitShowTrackedFiles('*.md');
      
      expect(execSync).toHaveBeenCalledWith('git ls-files -- "*.md"', { encoding: 'utf8' });
    });
    
    test('returns empty array when no files match', async () => {
      execSync.mockReturnValue(Buffer.from(''));
      
      const result = await gitShowTrackedFiles();
      
      expect(result).toEqual([]);
    });
  });
});