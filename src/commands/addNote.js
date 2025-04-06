// ABOUTME: Add-note command implementation
// ABOUTME: Adds notes to specific sections of issues

const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const { getIssueDirectoryPath } = require('../utils/directory');
const { getIssueFilePath } = require('../utils/issueManager');
const { getCurrentIssue } = require('../utils/issueManager');
const { 
  addContentToSection, 
  normalizeSectionName 
} = require('../utils/sectionManager');
const output = require('../utils/outputManager');
const { UserError, SystemError, SectionNotFoundError } = require('../utils/errors');

/**
 * Add a plain text note to a specific section of an issue
 * 
 * @param {string} noteText - The note text to add
 * @param {Object} options - Command options
 * @param {string|null} options.issue - Issue number (optional, uses current if not provided)
 * @param {string} options.section - Section to add note to
 * @returns {Promise<void>}
 */
async function addNoteAction(noteText, options = {}) {
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
    
    // Get normalized section name
    const normalizedSection = normalizeSectionName(options.section);
    
    try {
      // Add plain text note to the section (no format specified)
      const updatedContent = addContentToSection(
        content, 
        normalizedSection, 
        noteText, 
        null, // No format - plain text only
        options
      );
      
      // Write the updated content back to the file
      await fs.writeFile(issueFilePath, updatedContent, 'utf8');
      
      output.success(`Added note to ${normalizedSection} section of issue #${issueNumber}`);
    } catch (sectionErr) {
      // Handle section not found specifically
      if (sectionErr.message.includes('not found')) {
        const error = new SectionNotFoundError(normalizedSection);
        error.withDisplayMessage(`Section "${normalizedSection}" not found in issue`);
        throw error;
      }
      throw sectionErr;
    }
  } catch (err) {
    if (err instanceof UserError || err instanceof SectionNotFoundError) {
      // Add formatted display message if not already set
      if (!err.displayMessage) {
        err.withDisplayMessage(`${err.message}${err.recoveryHint ? ` (${err.recoveryHint})` : ''}`);
      }
    } else {
      // Wrap non-IssueCardsError errors
      const errorMsg = `Failed to add note: ${err.message}`;
      const wrappedError = new SystemError(errorMsg).withDisplayMessage(errorMsg);
      throw wrappedError;
    }
    throw err;
  }
}

/**
 * Create the add-note command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  const command = new Command('add-note')
    .description('Add a plain text note to a specific section of an issue')
    .argument('<note>', 'The note text to add')
    .option('-i, --issue <issueNumber>', 'Issue number (uses current issue if not specified)')
    .option('-s, --section <sectionName>', 'Section to add note to (problem, approach, failed-approaches, etc.)', 'problem')
    .action(addNoteAction);
    
  // Add rich help text
  command.addHelpText('after', `
Description:
  Adds a plain text note to a specific section of an issue. Unlike other commands
  that add content to specialized sections, this command can add text to any section
  of an issue. By default, notes are added to the "Problem to be solved" section.

Examples:
  # Add a note to the default section (Problem to be solved)
  $ issue-cards add-note "The bug only occurs in Chrome browsers"
  
  # Add a note to a specific section
  $ issue-cards add-note "We should use bcrypt for password hashing" -s approach
  
  # Add a note to the instructions section
  $ issue-cards add-note "Ensure backward compatibility with API v1" --section instructions
  
  # Add a note to a specific issue's approach section
  $ issue-cards add-note "Use Redis for caching" -i 3 -s approach

Available Sections:
  - problem (default)      - "Problem to be solved" section
  - approach               - "Planned approach" section
  - instructions           - "Instructions" section
  - failed-approaches      - "Failed approaches" section (consider using log-failure instead)
  - questions              - "Questions to resolve" section (consider using add-question instead)
  - next-steps             - "Next steps" section

Special Purpose Commands:
  For adding to specialized sections, these dedicated commands are recommended:
  - For failed approaches: use 'issue-cards log-failure'
  - For questions: use 'issue-cards add-question'
  - For tasks: use 'issue-cards add-task'

Related Commands:
  $ issue-cards log-failure  # Document approaches that didn't work
  $ issue-cards add-question # Add questions to resolve
  $ issue-cards current      # View current task with context
  `);
    
  return command;
}

module.exports = {
  createCommand,
  addNoteAction // Exported for testing
};