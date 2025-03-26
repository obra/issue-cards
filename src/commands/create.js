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
const { UninitializedError, TemplateNotFoundError, UserError, SystemError } = require('../utils/errors');

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
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // Validate template exists
    const validTemplate = await validateTemplate(templateName, 'issue');
    
    if (!validTemplate) {
      throw new TemplateNotFoundError(templateName)
        .withDisplayMessage(`Template not found: ${templateName}`);
    }
    
    // Require title
    if (!options.title) {
      throw new UserError('A title is required')
        .withRecoveryHint('Use --title "Your issue title"')
        .withDisplayMessage('A title is required (Use --title "Your issue title")');
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
      // Just re-throw the error with display message already set
      throw error;
    } else {
      // Wrap generic errors in a SystemError with display message
      throw new SystemError(`Failed to create issue: ${error.message}`)
        .withDisplayMessage(`Failed to create issue: ${error.message}`);
    }
  }
}

/**
 * Create the create command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  // Use the default template list for initial help text
  let templateList = 'feature, bugfix, refactor, audit';

  const command = new Command('create')
    .description('Create a new issue from template')
    .argument('<template>', `Template to use (${templateList})`)
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

  // Override the missingArgument behavior to show help instead of error
  command.missingArgument = function() {
    this.help();
    // This will exit the process due to commander's behavior
  };

  // Attempt to update the command help text with actual templates
  // This is done asynchronously but won't affect the command usage
  // since help is typically displayed later
  setTimeout(async () => {
    try {
      const templates = await getTemplateList('issue');
      if (templates && templates.length > 0) {
        // Update the argument description
        const updatedTemplateList = templates.join(', ');
        // We can't directly update the help text, but for future displays it will be updated
        command._args[0].description = `Template to use (${updatedTemplateList})`;
      }
    } catch (error) {
      // Silently fall back to default list
    }
  }, 0);

  return command;
}

module.exports = {
  createCommand,
  createAction, // Exported for testing
};