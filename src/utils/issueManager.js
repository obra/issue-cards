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

module.exports = {
  getIssueFilePath,
  getNextIssueNumber,
  saveIssue,
  getIssue,
  listIssues,
  extractIssueTitle,
};