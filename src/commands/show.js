// ABOUTME: Implementation of the 'show' command
// ABOUTME: Shows issue details

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { getIssue, listIssues } = require('../utils/issueManager');
const { formatSuccess, formatError } = require('../utils/output');

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
      console.error(formatError('Issue tracking is not initialized. Run `issue-cards init` first.'));
      return;
    }
    
    // If issue number provided, show that specific issue
    if (issueNumber) {
      try {
        const issueContent = await getIssue(issueNumber);
        console.log(issueContent);
      } catch (error) {
        console.error(formatError(error.message));
      }
      return;
    }
    
    // Otherwise, show the current issue (first open issue)
    const issues = await listIssues();
    
    if (issues.length === 0) {
      console.error(formatError('No open issues found.'));
      return;
    }
    
    // Display the first (current) issue
    console.log(issues[0].content);
  } catch (error) {
    console.error(formatError(`Failed to show issue: ${error.message}`));
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