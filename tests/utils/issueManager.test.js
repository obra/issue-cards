// ABOUTME: Tests for issue management utilities
// ABOUTME: Verifies issue creation, saving, and numbering functions

const fs = require('fs');
const path = require('path');
const { 
  getIssueFilePath, 
  getNextIssueNumber,
  saveIssue,
  listIssues,
  getIssue,
  closeIssue
} = require('../../src/utils/issueManager');
const directory = require('../../src/utils/directory');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn(),
  },
}));

jest.mock('../../src/utils/directory', () => ({
  getIssueDirectoryPath: jest.fn(),
}));

describe('Issue Manager utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock implementation for directory.getIssueDirectoryPath
    directory.getIssueDirectoryPath.mockImplementation((subdir) => {
      if (subdir === 'open') return '/project/.issues/open';
      if (subdir === 'closed') return '/project/.issues/closed';
      return '/project/.issues';
    });
  });
  
  describe('getIssueFilePath', () => {
    test('returns correct path for open issue', () => {
      const result = getIssueFilePath('0001', 'open');
      expect(result).toBe(path.join('/project/.issues/open', 'issue-0001.md'));
    });
    
    test('returns correct path for closed issue', () => {
      const result = getIssueFilePath('0001', 'closed');
      expect(result).toBe(path.join('/project/.issues/closed', 'issue-0001.md'));
    });
    
    test('defaults to open status when not specified', () => {
      const result = getIssueFilePath('0001');
      expect(result).toBe(path.join('/project/.issues/open', 'issue-0001.md'));
    });
    
    test('throws error for invalid status', () => {
      expect(() => getIssueFilePath('0001', 'invalid')).toThrow('Invalid issue status');
    });
  });
  
  describe('getNextIssueNumber', () => {
    test('returns 0001 when no issues exist', async () => {
      // Mock empty directories
      fs.promises.readdir.mockImplementation(() => Promise.resolve([]));
      
      const result = await getNextIssueNumber();
      
      expect(result).toBe('0001');
      expect(fs.promises.readdir).toHaveBeenCalledTimes(2); // Should check both open and closed dirs
    });
    
    test('returns next number based on existing issues', async () => {
      // Mock directories with existing issues
      fs.promises.readdir.mockImplementation((dir) => {
        if (dir === '/project/.issues/open') {
          return Promise.resolve(['issue-0001.md', 'issue-0003.md']);
        }
        if (dir === '/project/.issues/closed') {
          return Promise.resolve(['issue-0002.md', 'issue-0004.md']);
        }
        return Promise.resolve([]);
      });
      
      const result = await getNextIssueNumber();
      
      expect(result).toBe('0005');
      expect(fs.promises.readdir).toHaveBeenCalledTimes(2);
    });
    
    test('handles non-issue files in directories', async () => {
      // Mock directories with mix of issue and non-issue files
      fs.promises.readdir.mockImplementation((dir) => {
        if (dir === '/project/.issues/open') {
          return Promise.resolve(['issue-0001.md', 'something-else.txt']);
        }
        if (dir === '/project/.issues/closed') {
          return Promise.resolve(['issue-0002.md', '.DS_Store']);
        }
        return Promise.resolve([]);
      });
      
      const result = await getNextIssueNumber();
      
      expect(result).toBe('0003');
      expect(fs.promises.readdir).toHaveBeenCalledTimes(2);
    });
    
    test('handles read directory errors', async () => {
      // Mock readdir to throw error
      fs.promises.readdir.mockRejectedValue(new Error('Failed to read directory'));
      
      await expect(getNextIssueNumber()).rejects.toThrow('Failed to determine next issue number');
    });
  });
  
  describe('saveIssue', () => {
    test('saves issue content to file', async () => {
      const issueNumber = '0001';
      const content = '# Issue 0001: Test Issue';
      
      await saveIssue(issueNumber, content);
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join('/project/.issues/open', 'issue-0001.md'),
        content,
        'utf8'
      );
    });
    
    test('handles write file errors', async () => {
      // Mock writeFile to throw error
      fs.promises.writeFile.mockRejectedValue(new Error('Failed to write file'));
      
      await expect(saveIssue('0001', 'content')).rejects.toThrow('Failed to save issue');
    });
  });
  
  describe('getIssue', () => {
    test('reads issue content from open directory', async () => {
      // Mock readFile to return issue content
      const content = '# Issue 0001: Test Issue';
      fs.promises.readFile.mockResolvedValue(content);
      
      const result = await getIssue('0001');
      
      expect(result).toBe(content);
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        path.join('/project/.issues/open', 'issue-0001.md'),
        'utf8'
      );
    });
    
    test('reads issue content from closed directory if not in open', async () => {
      // Mock readFile to throw error for open directory, return content for closed
      fs.promises.readFile.mockImplementation((path) => {
        if (path.includes('/open/')) {
          return Promise.reject(new Error('File not found'));
        }
        return Promise.resolve('# Issue 0001: Test Issue');
      });
      
      const result = await getIssue('0001');
      
      expect(result).toBe('# Issue 0001: Test Issue');
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        path.join('/project/.issues/closed', 'issue-0001.md'),
        'utf8'
      );
    });
    
    test('throws error when issue not found in either directory', async () => {
      // Mock readFile to throw error for both directories
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(getIssue('0001')).rejects.toThrow('Issue #0001 not found');
    });
  });
  
  describe('listIssues', () => {
    test('returns list of issues with their numbers and titles', async () => {
      // Mock readdir to return issue files
      fs.promises.readdir.mockResolvedValue(['issue-0001.md', 'issue-0002.md']);
      
      // Mock readFile to return issue content
      fs.promises.readFile.mockImplementation((path) => {
        if (path.includes('0001')) {
          return Promise.resolve('# Issue 0001: First Issue');
        }
        if (path.includes('0002')) {
          return Promise.resolve('# Issue 0002: Second Issue');
        }
        return Promise.resolve('');
      });
      
      const result = await listIssues();
      
      expect(result).toEqual([
        { number: '0001', title: 'First Issue', content: '# Issue 0001: First Issue' },
        { number: '0002', title: 'Second Issue', content: '# Issue 0002: Second Issue' }
      ]);
      
      expect(fs.promises.readdir).toHaveBeenCalledWith('/project/.issues/open');
      expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
    });
    
    test('handles issues with invalid title format', async () => {
      // Mock readdir to return issue files
      fs.promises.readdir.mockResolvedValue(['issue-0001.md']);
      
      // Mock readFile to return issue content with invalid title
      fs.promises.readFile.mockResolvedValue('Invalid content');
      
      const result = await listIssues();
      
      expect(result).toEqual([
        { number: '0001', title: 'Untitled Issue', content: 'Invalid content' }
      ]);
    });
    
    test('handles read directory errors', async () => {
      // Mock readdir to throw error
      fs.promises.readdir.mockRejectedValue(new Error('Failed to read directory'));
      
      await expect(listIssues()).rejects.toThrow('Failed to list issues');
    });
    
    test('handles read file errors', async () => {
      // Mock readdir to return issue files
      fs.promises.readdir.mockResolvedValue(['issue-0001.md']);
      
      // Mock readFile to throw error
      fs.promises.readFile.mockRejectedValue(new Error('Failed to read file'));
      
      const result = await listIssues();
      
      // Should still return an array, but with error information
      expect(result).toEqual([
        { number: '0001', title: 'Error: Failed to read file', content: '' }
      ]);
    });
  });
  
  describe('closeIssue', () => {
    test('moves issue from open to closed directory', async () => {
      // Mock readFile to return issue content
      const issueContent = '# Issue 0001: Test Issue';
      fs.promises.readFile.mockResolvedValue(issueContent);
      
      // Mock successful rename
      fs.promises.rename.mockResolvedValue();
      
      await closeIssue('0001');
      
      // Should read issue content first
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        path.join('/project/.issues/open', 'issue-0001.md'),
        'utf8'
      );
      
      // Should move issue file from open to closed
      expect(fs.promises.rename).toHaveBeenCalledWith(
        path.join('/project/.issues/open', 'issue-0001.md'),
        path.join('/project/.issues/closed', 'issue-0001.md')
      );
    });
    
    test('handles issue not found error', async () => {
      // Mock readFile to throw error
      fs.promises.readFile.mockRejectedValue(new Error('Issue not found'));
      
      await expect(closeIssue('0001')).rejects.toThrow('Failed to close issue');
    });
    
    test('handles rename error', async () => {
      // Mock readFile to return issue content
      fs.promises.readFile.mockResolvedValue('# Issue 0001: Test Issue');
      
      // Mock rename to throw error
      fs.promises.rename.mockRejectedValue(new Error('Cannot rename file'));
      
      await expect(closeIssue('0001')).rejects.toThrow('Failed to close issue');
    });
  });
});