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
const { extractExpandTagsFromTask, isTagAtEnd } = require('../utils/taskParser');
const { expandTask } = require('../utils/taskExpander');

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
 * Format tasks with checkboxes and expand tags
 * 
 * @param {string[]} input - Array of tasks
 * @returns {Promise<string>} Input formatted as markdown task list with expanded tags
 */
async function formatAsTasks(input) {
  if (!input) return '';
  
  // Handle array of tasks (from multiple --task options)
  const formattedTasks = [];
  
  for (const task of input) {
    if (!task || !task.trim()) continue;
    
    // If already formatted as a task, leave it as is
    let formattedTask = task.trim();
    if (!formattedTask.startsWith('- [ ]')) {
      formattedTask = `- [ ] ${formattedTask}`;
    }
    
    // Create a task object (similar to what extractTasks returns)
    const taskObj = {
      text: formattedTask.substring(6), // Remove '- [ ] ' prefix
      completed: false,
      index: 0
    };
    
    // Check if task has +tags that need to be expanded
    // Extract expansion tags (+tag)
    const expandTags = extractExpandTagsFromTask(taskObj);
    
    // Check if any expandable tags are found and they are at the end of the task
    if (expandTags && expandTags.length > 0) {
      // Verify each tag is at the end of the task text
      const validTags = expandTags.filter(tag => {
        const tagString = `+${tag.name}`;
        const tagWithParams = tag.params && Object.keys(tag.params).length > 0 
          ? `+${tag.name}(${Object.entries(tag.params).map(([k, v]) => `${k}=${v}`).join(',')})`
          : tagString;
        
        return isTagAtEnd(taskObj.text, tagWithParams);
      });
      
      if (validTags.length > 0) {
        // Expand the task
        const expandedSteps = await expandTask(taskObj);
        
        // If expansion was successful, replace the single task with expanded steps
        if (expandedSteps && expandedSteps.length > 0) {
          // Format expanded steps as a task list
          const expandedTasks = expandedSteps.map(step => `- [ ] ${step}`);
          formattedTasks.push(...expandedTasks);
          continue; // Skip adding the original task
        }
      }
    }
    
    // If no tags, tags not at the end, or expansion failed, just add the original task
    formattedTasks.push(formattedTask);
  }
  
  return formattedTasks.join('\n');
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
      TASKS: await formatAsTasks(options.task),
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
  // Synchronously get the template list - blocking but reliable
  let templateList = 'feature, bugfix, refactor, audit';
  
  try {
    // We're using the sync version of fs to avoid async complexity
    const fs = require('fs');
    const path = require('path');
    const { getIssueDirectoryPath } = require('../utils/directory');
    
    const templateDir = getIssueDirectoryPath('config/templates/issue');
    if (fs.existsSync(templateDir)) {
      const templates = fs.readdirSync(templateDir)
        .filter(file => file.endsWith('.md'))
        .map(file => path.basename(file, '.md'));
      
      if (templates.length > 0) {
        templateList = templates.join(', ');
      }
    }
  } catch (error) {
    // Silently fall back to the default list
  }

  const command = new Command('create')
    .description('Create a new issue from template')
    .argument('<template>', `Template to use (${templateList})`)
    .option('--title <issueTitle>', 'Issue title (required)')
    .option('--problem <problemDesc>', 'Description of the problem to solve')
    .option('--approach <approachDesc>', 'Planned approach for solving the issue')
    .option('--failed-approaches <approachesList>', 'List of approaches already tried (one per line)')
    .option('--questions <questionsList>', 'List of questions that need answers (one per line)')
    .option('--task <taskDesc>', 'A task to add to the issue (can be used multiple times)', (value, previous) => {
      const result = previous || [];
      result.push(value);
      return result;
    })
    .option('--instructions <instructionsText>', 'Guidelines to follow during implementation')
    .option('--next-steps <nextStepsList>', 'Future work (for context only)')
    .action(createAction);

  // Override the missingArgument behavior to show help instead of error
  command.missingArgument = function() {
    this.help();
    // This will exit the process due to commander's behavior
  };

  // Correct the command usage to show template before options
  command.usage('<template> [options]');

  // Add a longer help description with examples
  command.addHelpText('after', `
Examples:
  $ issue-cards create feature --title "New login system"
  $ issue-cards create bugfix --title "Fix login redirect" --problem "Redirect fails on mobile"
  $ issue-cards create refactor --title "Refactor authentication" --task "Extract auth logic" --task "Add tests"
  `);
  
  // Optionally add a more detailed list of templates to the help
  try {
    const fs = require('fs');
    const path = require('path');
    const { getIssueDirectoryPath } = require('../utils/directory');
    
    const templateDir = getIssueDirectoryPath('config/templates/issue');
    if (fs.existsSync(templateDir)) {
      const templates = fs.readdirSync(templateDir)
        .filter(file => file.endsWith('.md'))
        .map(file => path.basename(file, '.md'));
      
      if (templates.length > 0) {
        const templateListFormatted = templates.map(t => `  - ${t}`).join('\n');
        command.addHelpText('after', `
Available issue templates:
${templateListFormatted}
        `);
      }
    }
  } catch (error) {
    // Fall back to generic help if we can't list templates
    command.addHelpText('after', `
Available templates:
  Run 'issue-cards templates' to see all available templates
    `);
  }

  return command;
}

module.exports = {
  createCommand,
  createAction, // Exported for testing
};