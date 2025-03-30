// ABOUTME: Add-question command implementation
// ABOUTME: Adds questions to the Questions to resolve section

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const { getIssueDirectoryPath } = require('../utils/directory');
const { getIssueFilePath } = require('../utils/issueManager');
const { getCurrentIssue } = require('../utils/issueManager');
const { 
  addContentToSection, 
  findSectionByName 
} = require('../utils/sectionManager');
const output = require('../utils/outputManager');
const { UserError, SystemError, SectionNotFoundError } = require('../utils/errors');

/**
 * Add a question to an issue
 * 
 * @param {string} questionText - The question to add
 * @param {Object} options - Command options
 * @param {number|null} options.issue - Issue number (optional, uses current if not provided)
 * @returns {Promise<void>}
 */
async function addQuestionAction(questionText, options = {}) {
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
    
    // Check if Questions to resolve section exists
    const sectionName = 'Questions to resolve';
    const section = findSectionByName(content, sectionName);
    
    if (!section) {
      throw new SectionNotFoundError(sectionName)
        .withDisplayMessage(`Section "${sectionName}" not found in issue`);
    }
    
    // Ensure the text ends with a question mark
    const formattedQuestion = questionText.endsWith('?') 
      ? questionText 
      : `${questionText}?`;
    
    // Add the question to the section
    const updatedContent = addContentToSection(
      content,
      sectionName,
      formattedQuestion,
      'question'
    );
    
    // Write the updated content back to the file
    await fs.writeFile(issueFilePath, updatedContent, 'utf8');
    
    output.success(`Added question to issue #${issueNumber}`);
  } catch (err) {
    if (err instanceof UserError || err instanceof SectionNotFoundError) {
      // Add formatted display message if not already set
      if (!err.displayMessage) {
        err.withDisplayMessage(`${err.message}${err.recoveryHint ? ` (${err.recoveryHint})` : ''}`);
      }
    } else {
      // Wrap non-IssueCardsError errors
      const errorMsg = `Failed to add question: ${err.message}`;
      const wrappedError = new SystemError(errorMsg).withDisplayMessage(errorMsg);
      throw wrappedError;
    }
    throw err;
  }
}

/**
 * Create the add-question command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('add-question')
    .description('Add a question to the Questions to resolve section')
    .argument('<question>', 'The question to add')
    .option('-i, --issue <number>', 'Issue number (uses current issue if not specified)')
    .action(addQuestionAction);
}

module.exports = {
  createCommand,
  addQuestionAction // Exported for testing
};