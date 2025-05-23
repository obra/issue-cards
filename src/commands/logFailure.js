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
 * @param {string|null} options.issue - Issue number (optional, uses current if not provided)
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
      issueNumber = currentIssue.issueNumber;
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
  const command = new Command('log-failure')
    .alias('failure')
    .description('Log a failed approach to an issue')
    .argument('<approach>', 'Description of the failed approach')
    .option('-i, --issue <issueNumber>', 'Issue number (uses current issue if not specified)')
    .option('-r, --reason <text>', 'Reason for the failure', 'Not specified')
    .action(logFailureAction);
    
  // Add rich help text
  command.addHelpText('after', `
Description:
  Documents approaches that were tried but didn't work by adding them to the 
  "Failed approaches" section of an issue. This helps prevent repeating the 
  same mistakes and provides valuable context for both humans and AI assistants.

Examples:
  # Log a failed approach to the current issue
  $ issue-cards log-failure "Tried using localStorage for token storage"
  
  # Log a failed approach with a specific reason
  $ issue-cards log-failure "Used JWT without expiration" --reason "Security vulnerability"
  
  # Log a failed approach to a specific issue
  $ issue-cards log-failure "Tried Redux for state management" -i 3 -r "Too complex for our needs"
  
  # Using the shorter alias
  $ issue-cards failure "Attempted CSS Grid layout" -r "Compatibility issues with older browsers"

Output Format:
  The failed approach is added to the "Failed approaches" section of the issue as a list item:
  - Tried using localStorage for token storage (Reason: Security vulnerability)

  When viewed with 'issue-cards current', failed approaches provide important context
  to help guide implementation decisions.

Purpose:
  Documenting failed approaches prevents team members from pursuing already-attempted
  solutions, provides insight into the problem's constraints, and creates a historical
  record of decision-making for the issue.

Related Commands:
  $ issue-cards add-question  # Add a question related to the issue
  $ issue-cards add-note      # Add a general note to any section
  $ issue-cards current       # View the current task with context including failed approaches
  `);
    
  return command;
}

module.exports = {
  createCommand,
  logFailureAction // Exported for testing
};