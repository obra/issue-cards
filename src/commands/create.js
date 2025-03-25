// ABOUTME: Implementation of the 'create' command
// ABOUTME: Creates new issues from templates

const { Command } = require('commander');
const path = require('path');
const { isInitialized, getIssueDirectoryPath } = require('../utils/directory');
const { loadTemplate, renderTemplate, validateTemplate } = require('../utils/template');
const { getNextIssueNumber, saveIssue } = require('../utils/issueManager');
const { isGitRepository, isGitAvailable } = require('../utils/gitDetection');
const { gitStage } = require('../utils/gitOperations');
const output = require('../utils/outputManager');
const { UninitializedError, TemplateNotFoundError, UserError } = require('../utils/errors');

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
 * @param {string[]} input - Array of tasks
 * @returns {string} Input formatted as markdown task list
 */
function formatAsTasks(input) {
  if (!input) return '';
  
  // Handle array of tasks (from multiple --task options)
  return input
    .filter(task => task && task.trim())
    .map(task => {
      // If already formatted as a task, leave it as is
      if (task.trim().startsWith('- [ ]')) {
        return task.trim();
      }
      
      // Otherwise, add the checkbox
      return `- [ ] ${task.trim()}`;
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
    output.success('New issue staged in git');
  } catch (error) {
    // Silently ignore git errors - git integration is optional
    // But log the error in debug mode
    output.debug(`Git operation skipped: ${error.message}`);
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
      throw new UninitializedError();
    }
    
    // Validate template exists
    const validTemplate = await validateTemplate(templateName, 'issue');
    
    if (!validTemplate) {
      throw new TemplateNotFoundError(templateName);
    }
    
    // Require title
    if (!options.title) {
      throw new UserError('A title is required').withRecoveryHint('Use --title "Your issue title"');
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
      TASKS: formatAsTasks(options.task),
      INSTRUCTIONS: options.instructions || '',
      NEXT_STEPS: formatAsList(options.nextSteps)
    };
    
    // Render template
    const issueContent = renderTemplate(templateContent, templateData);
    
    // Save issue
    await saveIssue(issueNumber, issueContent);
    
    // Try to stage the new issue in git
    await stageNewIssueInGit(issueNumber);
    
    output.success(`Created Issue #${issueNumber}: ${options.title}`);
    output.success(`Issue saved to .issues/open/issue-${issueNumber}.md`);
  } catch (error) {
    if (error instanceof UninitializedError || 
        error instanceof TemplateNotFoundError || 
        error instanceof UserError) {
      // Use structured error with recovery hint if available
      const hint = error.recoveryHint ? ` (${error.recoveryHint})` : '';
      output.error(`${error.message}${hint}`);
    } else {
      output.error(`Failed to create issue: ${error.message}`);
    }
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
    .option('--task <task>', 'A task to add to the issue (can be used multiple times)', (value, previous) => {
      const result = previous || [];
      result.push(value);
      return result;
    })
    .option('--instructions <guidelines>', 'Guidelines to follow during implementation')
    .option('--next-steps <list>', 'Future work (for context only)')
    .action(createAction);
}

module.exports = {
  createCommand,
  createAction, // Exported for testing
};