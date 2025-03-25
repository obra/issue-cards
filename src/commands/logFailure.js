// ABOUTME: Log-failure command implementation
// ABOUTME: Logs failed approaches to issues with reason for failure

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const { getIssueFilePath } = require('../utils/directory');
const { getCurrentIssue } = require('../utils/issueManager');
const { 
  addContentToSection, 
  findSectionByName, 
  normalizeSectionName 
} = require('../utils/sectionManager');
const { formatSuccess, formatError } = require('../utils/output');

/**
 * Log a failed approach to an issue
 * 
 * @param {string} approachText - Description of the failed approach
 * @param {Object} options - Command options
 * @param {number|null} options.issueNumber - Issue number (optional, uses current if not provided)
 * @param {string} options.reason - Reason for failure
 * @returns {Promise<void>}
 */
async function logFailureAction(approachText, options = {}) {
  try {
    // Use current issue if no issue number provided
    let issueNumber = options.issueNumber;
    
    if (!issueNumber) {
      const currentIssue = await getCurrentIssue();
      if (!currentIssue) {
        throw new Error('No current issue found. Specify an issue number or set a current issue.');
      }
      issueNumber = currentIssue.number;
    }
    
    // Get the issue file path
    const issueFilePath = getIssueFilePath(issueNumber.toString().padStart(4, '0'));
    
    // Read the issue content
    const content = await fs.readFile(issueFilePath, 'utf8');
    
    // Check if Failed approaches section exists
    const sectionName = 'Failed approaches';
    const section = findSectionByName(content, sectionName);
    
    if (!section) {
      throw new Error(`Section "${sectionName}" not found in issue`);
    }
    
    // Add the failed approach to the section
    const updatedContent = addContentToSection(
      content,
      sectionName,
      approachText,
      'failure',
      { reason: options.reason }
    );
    
    // Write the updated content back to the file
    await fs.writeFile(issueFilePath, updatedContent, 'utf8');
    
    console.log(formatSuccess(`Logged failed approach to issue #${issueNumber}`));
  } catch (err) {
    console.error(formatError(`Failed to log approach: ${err.message}`));
    throw err;
  }
}

/**
 * Create the log-failure command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('log-failure')
    .description('Log a failed approach to an issue')
    .argument('<approach>', 'Description of the failed approach')
    .option('-i, --issue-number <number>', 'Issue number (uses current issue if not specified)')
    .option('-r, --reason <text>', 'Reason for the failure', 'Not specified')
    .action(logFailureAction);
}

module.exports = {
  createCommand,
  logFailureAction // Exported for testing
};