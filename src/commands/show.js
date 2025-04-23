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
 * @param {Object} options - Command options
 * @param {string} [options.issue] - Optional issue number to show
 */
async function showAction(options = {}) {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // If issue number provided, show that specific issue
    if (options.issue) {
      try {
        // Pad to 4 digits for issue numbers like "0001"
        const paddedNumber = options.issue.toString().padStart(4, '0');
        const issueContent = await getIssue(paddedNumber);
        
        // Add a note that this is for reference only
        output.info('⚠️ This output is for reference only. If you are working on tasks, use "issue-cards current" instead.');
        output.blank();
        
        output.raw(issueContent);
      } catch (error) {
        throw new IssueNotFoundError(options.issue)
          .withDisplayMessage(`Issue #${options.issue} not found`);
      }
      return;
    }
    
    // Otherwise, show the current issue (first open issue)
    const issues = await listIssues();
    
    if (issues.length === 0) {
      throw new UserError('No open issues found')
        .withDisplayMessage('No open issues found.');
    }
    
    // Add a note that this is for reference only
    output.info('⚠️ This output is for reference only. If you are working on tasks, use "issue-cards current" instead.');
    output.blank();
    
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
  const command = new Command('show')
    .description('Show issue details')
    .option('-i, --issue <issueNumber>', 'Issue number to show (if omitted, shows the current issue)')
    .action(showAction);
    
  // Add rich help text
  command.addHelpText('after', `
Description:
  Displays the full content of an issue including all sections (problem, approach, 
  tasks, failed approaches, questions, etc). By default, it shows the current issue
  if no issue number is specified.

Examples:
  # Show the current issue
  $ issue-cards show
  
  # Show a specific issue by number
  $ issue-cards show -i 1
  $ issue-cards show --issue 0001
  
Issue format:
  Issues are formatted as Markdown files with sections including:
  - Title and issue number
  - Problem description
  - Planned approach
  - Tasks (with checkbox status)
  - Failed approaches
  - Questions to resolve
  - Implementation instructions

Usage notes:
  - Issue numbers can be specified with or without leading zeros
  - When no issue is specified, the first open issue is shown
  - Use 'issue-cards current' to focus on just the current task with context

Related commands:
  $ issue-cards list         # List all open issues
  $ issue-cards current      # Show only the current task with context
  `);
    
  return command;
}

module.exports = {
  createCommand,
  showAction, // Exported for testing
};