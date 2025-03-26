// ABOUTME: Implementation of the 'show' command
// ABOUTME: Shows issue details

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { getIssue, listIssues } = require('../utils/issueManager');
const output = require('../utils/outputManager');
const { UninitializedError, IssueNotFoundError, UserError, SystemError } = require('../utils/errors');

/**
 * Action handler for the show command
 * 
 * @param {string} [issueNumber] - Optional issue number to show
 */
async function showAction(issueNumber) {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // If issue number provided, show that specific issue
    if (issueNumber) {
      try {
        // Pad to 4 digits for issue numbers like "0001"
        const paddedNumber = issueNumber.toString().padStart(4, '0');
        const issueContent = await getIssue(paddedNumber);
        output.raw(issueContent);
      } catch (error) {
        throw new IssueNotFoundError(issueNumber)
          .withDisplayMessage(`Issue #${issueNumber} not found`);
      }
      return;
    }
    
    // Otherwise, show the current issue (first open issue)
    const issues = await listIssues();
    
    if (issues.length === 0) {
      throw new UserError('No open issues found')
        .withDisplayMessage('No open issues found.');
    }
    
    // Display the first (current) issue
    output.raw(issues[0].content);
  } catch (error) {
    if (error instanceof UninitializedError || 
        error instanceof IssueNotFoundError || 
        error instanceof UserError) {
      // Just re-throw the error with display message already set
      throw error;
    } else {
      // Wrap generic errors in a SystemError
      throw new SystemError(`Failed to show issue: ${error.message}`)
        .withDisplayMessage(`Failed to show issue: ${error.message}`);
    }
  }
}

/**
 * Create the show command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('show')
    .description('Show issue details')
    .argument('[issue-number]', 'Issue number to show. If omitted, shows the current issue.')
    .action(showAction);
}

module.exports = {
  createCommand,
  showAction, // Exported for testing
};