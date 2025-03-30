// ABOUTME: Implementation of the 'set-current' command
// ABOUTME: Sets a specific issue as the current issue

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { issueExists, setCurrentIssue } = require('../utils/issueManager');
const output = require('../utils/outputManager');
const { UninitializedError, UserError, SystemError, IssueNotFoundError } = require('../utils/errors');

/**
 * Validates issue number format
 * 
 * @param {string} issueNumber - Issue number to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidIssueNumber(issueNumber) {
  // Check if the input is a string representation of a positive number
  // Allow both "1" and "0001" formats
  const num = parseInt(issueNumber, 10);
  
  // It must be a positive integer, regardless of leading zeros
  return !isNaN(num) && num > 0 && /^\d+$/.test(issueNumber);
}

/**
 * Action handler for the set-current command
 * 
 * @param {Object} options - Command options
 * @param {string} options.issue - Issue number to set as current
 */
async function setCurrentAction(options) {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // Get the issue number from options
    const issueNumber = options.issue;
    
    // Validate issue number format
    if (!isValidIssueNumber(issueNumber)) {
      throw new UserError(`Invalid issue number: ${issueNumber}`)
        .withDisplayMessage(`Invalid issue number: ${issueNumber} (Must be a positive integer)`);
    }
    
    // Check if issue exists
    const exists = await issueExists(issueNumber);
    if (!exists) {
      throw new IssueNotFoundError(issueNumber)
        .withDisplayMessage(`Issue #${issueNumber} not found`);
    }
    
    // Set the issue as current
    await setCurrentIssue(issueNumber);
    
    output.success(`Issue #${issueNumber} is now current`);
    
  } catch (error) {
    if (error instanceof UninitializedError || 
        error instanceof UserError || 
        error instanceof IssueNotFoundError) {
      // Add formatted display message if not already set
      if (!error.displayMessage) {
        error.withDisplayMessage(`${error.message}${error.recoveryHint ? ` (${error.recoveryHint})` : ''}`);
      }
    } else {
      // Wrap non-IssueCardsError errors
      const errorMsg = `Failed to set current issue: ${error.message}`;
      error = new SystemError(errorMsg).withDisplayMessage(errorMsg);
    }
    throw error;
  }
}

/**
 * Create the set-current command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('set-current')
    .description('Set current issue for operations')
    .requiredOption('-i, --issue <number>', 'Issue number to set as current (required)')
    .action(setCurrentAction);
}

module.exports = {
  createCommand,
  setCurrentAction, // Exported for testing
};