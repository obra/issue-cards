// ABOUTME: Log-failure command implementation
// ABOUTME: Logs failed approaches to issues with reason for failure

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const { getIssueDirectoryPath } = require('../utils/directory');
const { getIssueFilePath } = require('../utils/issueManager');
const { getCurrentIssue } = require('../utils/issueManager');
const { 
  addContentToSection, 
  findSectionByName, 
  normalizeSectionName 
} = require('../utils/sectionManager');
const output = require('../utils/outputManager');
const { UserError, SectionNotFoundError, SystemError } = require('../utils/errors');

/**
 * Log a failed approach to an issue
 * 
 * @param {string} approachText - Description of the failed approach
 * @param {Object} options - Command options
 * @param {number|null} options.issue - Issue number (optional, uses current if not provided)
 * @param {string} options.reason - Reason for failure
 * @returns {Promise<void>}
 */
async function logFailureAction(approachText, options = {}) {
  try {
    // Use current issue if no issue number provided
    let issueNumber = options.issue;
    
    if (!issueNumber) {
      const currentIssue = await getCurrentIssue();
      if (!currentIssue) {
        throw new UserError('No current issue found')
          .withRecoveryHint('Specify an issue number or set a current issue')
          .withDisplayMessage('No current issue found (Specify an issue number or set a current issue)');
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
      throw new SectionNotFoundError(sectionName)
        .withDisplayMessage(`Section "${sectionName}" not found in issue`);
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
    
    output.success(`Logged failed approach to issue #${issueNumber}`);
  } catch (err) {
    if (err instanceof UserError || err instanceof SectionNotFoundError) {
      // Just re-throw the error with display message already set
      throw err;
    } else {
      // Wrap generic errors in a SystemError
      throw new SystemError(`Failed to log approach: ${err.message}`)
        .withDisplayMessage(`Failed to log approach: ${err.message}`);
    }
  }
}

/**
 * Create the log-failure command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('log-failure')
    .alias('failure')
    .description('Log a failed approach to an issue')
    .argument('<approach>', 'Description of the failed approach')
    .option('-i, --issue <number>', 'Issue number (uses current issue if not specified)')
    .option('-r, --reason <text>', 'Reason for the failure', 'Not specified')
    .action(logFailureAction);
}

module.exports = {
  createCommand,
  logFailureAction // Exported for testing
};