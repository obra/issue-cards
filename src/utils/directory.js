// ABOUTME: Directory structure utilities for Issue Cards
// ABOUTME: Handles creating and validating the issue tracking directory structure

const fs = require('fs');
const path = require('path');

/**
 * Get the absolute path to the issue directory or a subdirectory
 * 
 * @param {string} [subdir] - Optional subdirectory within the issues directory
 * @returns {string} The absolute path to the issue directory
 */
function getIssueDirectoryPath(subdir) {
  // Use environment variable if set, otherwise use default .issues directory
  const issuesDir = process.env.ISSUE_CARDS_DIR || path.join(process.cwd(), '.issues');
  return subdir ? path.join(issuesDir, subdir) : issuesDir;
}

/**
 * Check if the issue tracking system is initialized
 * 
 * @returns {Promise<boolean>} True if initialized, false otherwise
 */
async function isInitialized() {
  try {
    await fs.promises.access(getIssueDirectoryPath(), fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create the directory structure for the issue tracking system
 * 
 * @returns {Promise<void>}
 */
async function createDirectoryStructure() {
  const issuesDir = getIssueDirectoryPath();
  
  // Create main directories
  await fs.promises.mkdir(issuesDir, { recursive: true });
  await fs.promises.mkdir(path.join(issuesDir, 'open'), { recursive: true });
  await fs.promises.mkdir(path.join(issuesDir, 'closed'), { recursive: true });
  
  // Create template directories
  await fs.promises.mkdir(path.join(issuesDir, 'config', 'templates', 'issue'), { recursive: true });
  await fs.promises.mkdir(path.join(issuesDir, 'config', 'templates', 'tag'), { recursive: true });
}

module.exports = {
  getIssueDirectoryPath,
  isInitialized,
  createDirectoryStructure,
};