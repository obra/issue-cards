// ABOUTME: Implementation of the 'list' command
// ABOUTME: Lists all open issues

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { listIssues } = require('../utils/issueManager');
const { formatSuccess, formatError } = require('../utils/output');

/**
 * Action handler for the list command
 */
async function listAction() {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      console.error(formatError('Issue tracking is not initialized. Run `issue-cards init` first.'));
      return;
    }
    
    // Get all open issues
    const issues = await listIssues();
    
    if (issues.length === 0) {
      console.log('No open issues found.');
      return;
    }
    
    // Display issues
    console.log('Open Issues:');
    console.log('');
    
    issues.forEach(issue => {
      console.log(`  #${issue.number}: ${issue.title}`);
    });
    
    console.log('');
    console.log(`Total: ${issues.length} open issue${issues.length !== 1 ? 's' : ''}`);
  } catch (error) {
    console.error(formatError(`Failed to list issues: ${error.message}`));
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
    .action(listAction);
}

module.exports = {
  createCommand,
  listAction, // Exported for testing
};