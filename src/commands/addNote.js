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
const { formatSuccess, formatError } = require('../utils/output');

/**
 * Add a note to a specific section of an issue
 * 
 * @param {string} noteText - The note text to add
 * @param {Object} options - Command options
 * @param {number|null} options.issueNumber - Issue number (optional, uses current if not provided)
 * @param {string} options.section - Section to add note to
 * @param {string} options.format - Format type (optional)
 * @returns {Promise<void>}
 */
async function addNoteAction(noteText, options = {}) {
  try {
    // Use current issue if no issue number provided
    let issueNumber = options.issueNumber;
    
    if (!issueNumber) {
      const currentIssue = await getCurrentIssue();
      if (!currentIssue) {
        throw new Error('No current issue found. Specify an issue number or set a current issue.');
      }
      issueNumber = currentIssue.number;
    }
    
    // Get the issue file path
    const issueFilePath = getIssueFilePath(issueNumber.toString().padStart(4, '0'));
    
    // Read the issue content
    const content = await fs.readFile(issueFilePath, 'utf8');
    
    // Get normalized section name
    const normalizedSection = normalizeSectionName(options.section);
    
    // Add note to the section
    const updatedContent = addContentToSection(
      content, 
      normalizedSection, 
      noteText, 
      options.format,
      options
    );
    
    // Write the updated content back to the file
    await fs.writeFile(issueFilePath, updatedContent, 'utf8');
    
    console.log(formatSuccess(`Added note to ${normalizedSection} section of issue #${issueNumber}`));
  } catch (err) {
    console.error(formatError(`Failed to add note: ${err.message}`));
    throw err;
  }
}

/**
 * Create the add-note command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('add-note')
    .description('Add a note to a specific section of an issue')
    .argument('<note>', 'The note text to add')
    .option('-i, --issue-number <number>', 'Issue number (uses current issue if not specified)')
    .option('-s, --section <name>', 'Section to add note to (problem, approach, failed-approaches, etc.)', 'problem')
    .option('-f, --format <type>', 'Note format (question, failure, task, or blank for normal note)')
    .option('-r, --reason <text>', 'Reason for a failed approach (used with --format=failure)')
    .action(addNoteAction);
}

module.exports = {
  createCommand,
  addNoteAction // Exported for testing
};