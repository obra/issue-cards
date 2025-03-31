// ABOUTME: Implementation of the 'list' command
// ABOUTME: Lists all open issues

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { listIssues } = require('../utils/issueManager');
const output = require('../utils/outputManager');
const { UninitializedError, SystemError } = require('../utils/errors');

/**
 * Action handler for the list command
 * 
 * @param {Object} options - Command options
 * @param {boolean} options.json - Output in JSON format
 */
async function listAction(options) {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // Get all open issues
    const issues = await listIssues();
    
    // Configure JSON output if requested
    if (options.json) {
      output.configure({ json: true });
    }
    
    if (issues.length === 0) {
      output.info('No open issues found.');
      return;
    }
    
    if (options.json) {
      // For JSON output, just print the raw JSON
      console.log(JSON.stringify(issues));
    } else {
      // Display issues in standard format
      output.section('Open Issues', issues.map(issue => `#${issue.issueNumber}: ${issue.title}`));
      output.info(`Total: ${issues.length} open issue${issues.length !== 1 ? 's' : ''}`);
    }
  } catch (error) {
    if (error instanceof UninitializedError) {
      // Just re-throw the error with display message already set
      throw error;
    } else {
      // Wrap generic errors in a SystemError with display message but don't display directly
      throw new SystemError(`Failed to list issues: ${error.message}`)
        .withDisplayMessage(`Failed to list issues: ${error.message}`);
    }
  }
}

/**
 * Create the list command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('list')
    .description('List all open issues')
    .option('--json', 'Output in JSON format')
    .action(listAction);
}

module.exports = {
  createCommand,
  listAction, // Exported for testing
};