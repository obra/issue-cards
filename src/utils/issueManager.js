// ABOUTME: Issue management utilities
// ABOUTME: Handles issue creation, reading, and listing

const fs = require('fs');
const path = require('path');
const { getIssueDirectoryPath } = require('./directory');

/**
 * Get the file path for an issue
 * 
 * @param {string} issueNumber - Issue number (e.g., '0001')
 * @param {string} [status='open'] - Issue status ('open' or 'closed')
 * @returns {string} Absolute path to the issue file
 */
function getIssueFilePath(issueNumber, status = 'open') {
  if (status !== 'open' && status !== 'closed') {
    throw new Error(`Invalid issue status: ${status}`);
  }
  
  const issuesDir = getIssueDirectoryPath(status);
  return path.join(issuesDir, `issue-${issueNumber}.md`);
}

/**
 * Get the next available issue number
 * 
 * @returns {Promise<string>} Next issue number (e.g., '0001')
 */
async function getNextIssueNumber() {
  try {
    const openDir = getIssueDirectoryPath('open');
    const closedDir = getIssueDirectoryPath('closed');
    
    // Get all issue files from both directories
    const [openFiles, closedFiles] = await Promise.all([
      fs.promises.readdir(openDir),
      fs.promises.readdir(closedDir)
    ]);
    
    // Extract issue numbers from filenames
    const issueNumbers = [...openFiles, ...closedFiles]
      .filter(file => file.startsWith('issue-') && file.endsWith('.md'))
      .map(file => {
        const match = file.match(/issue-(\d+)\.md/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    // Get the maximum number or 0 if no issues exist
    const maxNumber = issueNumbers.length > 0 ? Math.max(...issueNumbers) : 0;
    
    // Format the next number with leading zeros
    return (maxNumber + 1).toString().padStart(4, '0');
  } catch (error) {
    throw new Error(`Failed to determine next issue number: ${error.message}`);
  }
}

/**
 * Save issue content to a file
 * 
 * @param {string} issueNumber - Issue number (e.g., '0001')
 * @param {string} content - Issue content in markdown format
 * @param {string} [status='open'] - Issue status ('open' or 'closed')
 * @returns {Promise<void>}
 */
async function saveIssue(issueNumber, content, status = 'open') {
  try {
    const filePath = getIssueFilePath(issueNumber, status);
    await fs.promises.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to save issue: ${error.message}`);
  }
}

/**
 * Get issue content by number
 * 
 * @param {string} issueNumber - Issue number (e.g., '0001')
 * @returns {Promise<string>} Issue content
 */
async function getIssue(issueNumber) {
  try {
    // Try open directory first
    try {
      const openPath = getIssueFilePath(issueNumber, 'open');
      return await fs.promises.readFile(openPath, 'utf8');
    } catch (openError) {
      // If not found in open, try closed directory
      const closedPath = getIssueFilePath(issueNumber, 'closed');
      return await fs.promises.readFile(closedPath, 'utf8');
    }
  } catch (error) {
    throw new Error(`Issue #${issueNumber} not found`);
  }
}

/**
 * Extract title from issue content
 * 
 * @param {string} content - Issue content
 * @param {string} issueNumber - Issue number for fallback title
 * @returns {string} Issue title
 */
function extractIssueTitle(content, issueNumber) {
  try {
    // Look for the title in the first line (# Issue XXXX: Title)
    const firstLine = content.split('\n')[0] || '';
    const match = firstLine.match(/^#\s+Issue\s+\d+:\s+(.+)$/);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return `Untitled Issue`;
  } catch (error) {
    return `Untitled Issue`;
  }
}

/**
 * List all open issues
 * 
 * @returns {Promise<Array<Object>>} List of issues with number, title, and content
 */
async function listIssues() {
  try {
    const openDir = getIssueDirectoryPath('open');
    const files = await fs.promises.readdir(openDir);
    
    // Filter and sort issue files
    const issueFiles = files
      .filter(file => file.startsWith('issue-') && file.endsWith('.md'))
      .sort();
    
    // Read each issue file and extract information
    const issues = await Promise.all(
      issueFiles.map(async (file) => {
        const match = file.match(/issue-(\d+)\.md/);
        const issueNumber = match ? match[1] : '';
        
        try {
          const content = await fs.promises.readFile(
            path.join(openDir, file),
            'utf8'
          );
          
          const title = extractIssueTitle(content, issueNumber);
          
          return {
            number: issueNumber,
            title,
            content
          };
        } catch (error) {
          // If we can't read the file, still return basic info with error
          return {
            number: issueNumber,
            title: `Error: ${error.message}`,
            content: ''
          };
        }
      })
    );
    
    return issues;
  } catch (error) {
    throw new Error(`Failed to list issues: ${error.message}`);
  }
}

/**
 * Get the oldest open issue (considered the current issue)
 * 
 * @returns {Promise<Object|null>} Current issue object or null if none exists
 */
async function getCurrentIssue() {
  try {
    const issues = await listIssues();
    
    if (issues.length === 0) {
      return null;
    }
    
    // Return the oldest issue (first in the alphabetically sorted list)
    const firstIssue = issues[0];
    
    return {
      number: firstIssue.number,
      title: firstIssue.title,
      content: firstIssue.content,
      path: getIssueFilePath(firstIssue.number, 'open')
    };
  } catch (error) {
    throw new Error(`Failed to get current issue: ${error.message}`);
  }
}

/**
 * Read issue content from file path
 * 
 * @param {string} filePath - Path to the issue file
 * @returns {Promise<string>} Issue content
 */
async function readIssue(filePath) {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read issue: ${error.message}`);
  }
}

/**
 * Write issue content to file path
 * 
 * @param {string} filePath - Path to the issue file
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
async function writeIssue(filePath, content) {
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write issue: ${error.message}`);
  }
}

/**
 * Close an issue by moving it from open to closed directory
 * 
 * @param {string} issueNumber - Issue number (e.g., '0001')
 * @returns {Promise<void>}
 */
async function closeIssue(issueNumber) {
  try {
    // Check that the issue exists in the open directory
    const openPath = getIssueFilePath(issueNumber, 'open');
    
    // Read the issue content to verify it exists
    await fs.promises.readFile(openPath, 'utf8');
    
    // Move the issue file from open to closed directory
    const closedPath = getIssueFilePath(issueNumber, 'closed');
    await fs.promises.rename(openPath, closedPath);
  } catch (error) {
    throw new Error(`Failed to close issue: ${error.message}`);
  }
}

module.exports = {
  getIssueFilePath,
  getNextIssueNumber,
  saveIssue,
  getIssue,
  listIssues,
  extractIssueTitle,
  getCurrentIssue,
  readIssue,
  writeIssue,
  closeIssue
};