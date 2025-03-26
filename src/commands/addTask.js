// ABOUTME: Implementation of the 'add-task' command
// ABOUTME: Adds new tasks with optional tags and positioning

const { Command } = require('commander');
const fs = require('fs');
const { isInitialized } = require('../utils/directory');
const { listIssues, readIssue, writeIssue, getIssueFilePath } = require('../utils/issueManager');
const { extractTasks, findCurrentTask, extractTagsFromTask } = require('../utils/taskParser');
const { validateTagTemplate } = require('../utils/taskExpander');
const { getTemplateList } = require('../utils/template');
const output = require('../utils/outputManager');
const { UninitializedError, UserError, SystemError, IssueNotFoundError } = require('../utils/errors');

/**
 * Insert a task into a list of tasks at the specified position
 * 
 * @param {string} content - Original issue content
 * @param {string} taskText - Task text to add
 * @param {string} position - Position to insert task ('before-current', 'after-current', 'end')
 * @returns {Promise<string>} Updated issue content
 */
async function insertTaskIntoContent(content, taskText, position) {
  // Extract existing tasks
  const tasks = await extractTasks(content);
  
  // Find the current task
  const currentTask = findCurrentTask(tasks);
  
  // Determine insertion point
  let insertionIndex = -1;
  
  if (position === 'before-current' && currentTask) {
    // Insert before the current task
    insertionIndex = findInsertionLineNumber(content, currentTask, true);
  } else if (position === 'after-current' && currentTask) {
    // Insert after the current task
    insertionIndex = findInsertionLineNumber(content, currentTask, false);
  } else {
    // Insert at the end of the task list
    insertionIndex = findTasksSectionEnd(content);
  }
  
  if (insertionIndex === -1) {
    throw new Error('Could not determine insertion point');
  }
  
  // Prepare the new task line
  const newTaskLine = `- [ ] ${taskText}`;
  
  // Insert the task at the determined position
  const lines = content.split('\n');
  lines.splice(insertionIndex, 0, newTaskLine);
  
  return lines.join('\n');
}

/**
 * Find the line number where a task should be inserted
 * 
 * @param {string} content - Issue content
 * @param {Object} task - Task reference
 * @param {boolean} before - Whether to insert before (true) or after (false) the task
 * @returns {number} Line number for insertion
 */
function findInsertionLineNumber(content, task, before) {
  const lines = content.split('\n');
  let inTasksSection = false;
  let taskCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're entering the Tasks section
    if (line === '## Tasks') {
      inTasksSection = true;
      continue;
    }
    
    // Check if we're leaving the Tasks section
    if (inTasksSection && line.startsWith('##')) {
      inTasksSection = false;
      // If we're at the end of the Tasks section and haven't found the task,
      // return this line number for insertion at the end
      if (taskCount <= task.index) {
        return i;
      }
    }
    
    // If we're in the Tasks section and this looks like a task item
    if (inTasksSection && (line.startsWith('- [ ]') || line.startsWith('- [x]'))) {
      // If this is the task we're targeting
      if (taskCount === task.index) {
        // Return this line for insertion before the task
        if (before) {
          return i;
        }
        // Return next line for insertion after the task
        return i + 1;
      }
      
      taskCount++;
    }
  }
  
  // If we didn't find a good insertion point, return -1
  return -1;
}

/**
 * Find the end of the Tasks section
 * 
 * @param {string} content - Issue content
 * @returns {number} Line number for insertion at the end of tasks
 */
function findTasksSectionEnd(content) {
  const lines = content.split('\n');
  let inTasksSection = false;
  let lastTaskLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're entering the Tasks section
    if (line === '## Tasks') {
      inTasksSection = true;
      continue;
    }
    
    // Check if we're leaving the Tasks section
    if (inTasksSection && line.startsWith('##')) {
      // Return line number of the start of the next section
      return i;
    }
    
    // If we're in the Tasks section and this looks like a task item
    if (inTasksSection && (line.startsWith('- [ ]') || line.startsWith('- [x]'))) {
      lastTaskLine = i;
    }
  }
  
  // If we didn't find the end but we found tasks, return after the last task
  if (lastTaskLine !== -1) {
    return lastTaskLine + 1;
  }
  
  // If we didn't find any tasks, find the Tasks heading
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '## Tasks') {
      // Return the line after the heading
      return i + 1;
    }
  }
  
  // If we didn't find the Tasks section, return -1
  return -1;
}

/**
 * Validate tags against available tag templates
 * 
 * @param {Array<Object>} tags - Tags to validate
 * @returns {Promise<Array<string>>} Array of validation error messages
 */
async function validateTags(tags) {
  const errors = [];
  
  // Get available tag templates
  const availableTags = await getTemplateList('tag');
  
  for (const tag of tags) {
    // Check if tag exists
    if (!availableTags.includes(tag.name)) {
      errors.push(`Tag '${tag.name}' does not exist`);
      continue;
    }
    
    // Validate tag template structure
    const validation = await validateTagTemplate(tag.name);
    if (!validation.valid) {
      errors.push(`Tag '${tag.name}' has invalid template: ${validation.errors.join(', ')}`);
    }
  }
  
  return errors;
}

/**
 * Action handler for the add-task command
 * 
 * @param {string} taskText - Text of the task to add
 * @param {Object} options - Command options
 */
async function addTaskAction(taskText, options) {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // Get open issues
    const issues = await listIssues();
    
    if (issues.length === 0) {
      throw new UserError('No open issues found')
        .withDisplayMessage('No open issues found');
    }
    
    // Default to the first issue
    let issueNumber = options.issue || issues[0].number;
    
    // Find the issue - pad to 4 digits for issue numbers like "0001"
    const paddedNumber = issueNumber.toString().padStart(4, '0');
    const issue = issues.find(i => i.number === paddedNumber);
    
    if (!issue) {
      throw new IssueNotFoundError(issueNumber)
        .withDisplayMessage(`Issue #${issueNumber} not found`);
    }
    
    // Make sure issue.path exists or construct it
    const issuePath = issue.path || getIssueFilePath(issue.number);
    
    // Read the issue content
    const issueContent = await readIssue(issuePath);
    
    // Create a mock task object to extract tags
    const mockTask = { text: taskText, completed: false, index: -1 };
    const tags = extractTagsFromTask(mockTask);
    
    // Validate tags
    const tagErrors = await validateTags(tags);
    
    if (tagErrors.length > 0) {
      throw new UserError(`Invalid tags in task: ${tagErrors.join(', ')}`)
        .withDisplayMessage(`Invalid tags in task: ${tagErrors.join(', ')}`);
    }
    
    // Determine position
    let position = 'end';
    if (options.before) {
      position = 'before-current';
    } else if (options.after) {
      position = 'after-current';
    }
    
    // Insert the task
    const updatedContent = await insertTaskIntoContent(issueContent, taskText, position);
    
    // Write the updated issue
    await writeIssue(issuePath, updatedContent);
    
    output.success(`Task added to issue ${issue.number} at position: ${position}`);
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
      const errorMsg = `Failed to add task: ${error.message}`;
      error = new SystemError(errorMsg).withDisplayMessage(errorMsg);
    }
    throw error;
  }
}

/**
 * Create the add-task command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('add-task')
    .description('Add a new task to an issue')
    .argument('<task-text>', 'Text of the task to add (use quotes, include tags with #)')
    .option('-i, --issue <id>', 'Issue ID to add task to (defaults to first open issue)')
    .option('-b, --before', 'Add task before the current task')
    .option('-a, --after', 'Add task after the current task')
    .action(addTaskAction);
}

module.exports = {
  createCommand,
  addTaskAction, // Exported for testing
  insertTaskIntoContent, // Exported for testing
  findInsertionLineNumber, // Exported for testing
  findTasksSectionEnd, // Exported for testing
  validateTags, // Exported for testing
};