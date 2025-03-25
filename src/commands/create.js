// ABOUTME: Implementation of the 'create' command
// ABOUTME: Creates new issues from templates

const { Command } = require('commander');
const path = require('path');
const { isInitialized, getIssueDirectoryPath } = require('../utils/directory');
const { loadTemplate, renderTemplate, validateTemplate } = require('../utils/template');
const { getNextIssueNumber, saveIssue } = require('../utils/issueManager');
const { formatSuccess, formatError } = require('../utils/output');
const { isGitRepository, isGitAvailable } = require('../utils/gitDetection');
const { gitStage } = require('../utils/gitOperations');

/**
 * Format multi-line input as a list
 * 
 * @param {string} input - Multi-line string input
 * @returns {string} Input formatted as markdown list
 */
function formatAsList(input) {
  if (!input) return '';
  
  return input
    .split('\n')
    .filter(line => line.trim())
    .map(line => `- ${line.trim()}`)
    .join('\n');
}

/**
 * Format tasks with checkboxes
 * 
 * @param {string} input - Multi-line string input
 * @returns {string} Input formatted as markdown task list
 */
function formatAsTasks(input) {
  if (!input) return '';
  
  return input
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      // If already formatted as a task, leave it as is
      if (line.trim().startsWith('- [ ]')) {
        return line.trim();
      }
      
      // Otherwise, add the checkbox
      return `- [ ] ${line.trim()}`;
    })
    .join('\n');
}

/**
 * Stage issue file in git
 * 
 * @param {string} issueNumber - Issue number
 * @returns {Promise<void>}
 */
async function stageNewIssueInGit(issueNumber) {
  try {
    // Check if git is available and we're in a git repo
    if (!isGitAvailable() || !(await isGitRepository())) {
      return; // Git not available or not in a repo, silently skip
    }
    
    // Get the path to the issue file
    const issueFilePath = path.join(getIssueDirectoryPath('open'), `issue-${issueNumber}.md`);
    
    // Stage the file
    await gitStage(issueFilePath);
    console.log(formatSuccess('New issue staged in git'));
  } catch (error) {
    // Silently ignore git errors - git integration is optional
    // But log the error if we're in debug mode
    if (process.env.DEBUG) {
      console.error(`Git error (ignored): ${error.message}`);
    }
  }
}

/**
 * Action handler for the create command
 * 
 * @param {string} templateName - Name of the template to use
 * @param {Object} options - Command options
 */
async function createAction(templateName, options) {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      console.error(formatError('Issue tracking is not initialized. Run `issue-cards init` first.'));
      return;
    }
    
    // Validate template exists
    const validTemplate = await validateTemplate(templateName, 'issue');
    
    if (!validTemplate) {
      console.error(formatError(`Template not found: ${templateName}`));
      return;
    }
    
    // Require title
    if (!options.title) {
      console.error(formatError('A title is required. Use --title "Your issue title"'));
      return;
    }
    
    // Get next issue number
    const issueNumber = await getNextIssueNumber();
    
    // Load template
    const templateContent = await loadTemplate(templateName, 'issue');
    
    // Prepare template data
    const templateData = {
      NUMBER: issueNumber,
      TITLE: options.title,
      PROBLEM: options.problem || '',
      APPROACH: options.approach || '',
      FAILED_APPROACHES: formatAsList(options.failedApproaches),
      QUESTIONS: formatAsList(options.questions),
      TASKS: formatAsTasks(options.tasks),
      INSTRUCTIONS: options.instructions || '',
      NEXT_STEPS: formatAsList(options.nextSteps)
    };
    
    // Render template
    const issueContent = renderTemplate(templateContent, templateData);
    
    // Save issue
    await saveIssue(issueNumber, issueContent);
    
    // Try to stage the new issue in git
    await stageNewIssueInGit(issueNumber);
    
    console.log(formatSuccess(`Created Issue #${issueNumber}: ${options.title}`));
    console.log(formatSuccess(`Issue saved to .issues/open/issue-${issueNumber}.md`));
  } catch (error) {
    console.error(formatError(`Failed to create issue: ${error.message}`));
  }
}

/**
 * Create the create command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('create')
    .description('Create a new issue from template')
    .argument('<template>', 'Template to use (feature, bugfix, refactor, audit)')
    .option('--title <title>', 'Issue title (required)')
    .option('--problem <description>', 'Description of the problem to solve')
    .option('--approach <strategy>', 'Planned approach for solving the issue')
    .option('--failed-approaches <list>', 'List of approaches already tried (one per line)')
    .option('--questions <list>', 'List of questions that need answers (one per line)')
    .option('--tasks <list>', 'List of tasks, one per line')
    .option('--instructions <guidelines>', 'Guidelines to follow during implementation')
    .option('--next-steps <list>', 'Future work (for context only)')
    .action(createAction);
}

module.exports = {
  createCommand,
  createAction, // Exported for testing
};