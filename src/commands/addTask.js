// ABOUTME: Implementation of the 'add-task' command
// ABOUTME: Adds new tasks with optional tags and positioning

const { Command } = require('commander');
const fs = require('fs');
const { isInitialized } = require('../utils/directory');
const { listIssues, readIssue, writeIssue, getIssueFilePath } = require('../utils/issueManager');
const { extractTasks, findCurrentTask, extractTagsFromTask, extractExpandTagsFromTask, isTagAtEnd } = require('../utils/taskParser');
const { validateTagTemplate, expandTask } = require('../utils/taskExpander');
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
  
  // Check if task has expansion tags (+tag) that need to be expanded
  const lines = content.split('\n');
  const tasksToInsert = [];
  
  // Create a task object (similar to what extractTasks returns)
  const mockTask = {
    text: taskText,
    completed: false,
    index: 0
  };
  
  // Check if the task has +tags for expansion
  const expandTags = extractExpandTagsFromTask(mockTask);
  
  if (expandTags && expandTags.length > 0) {
    // Check if each tag is at the end of the task
    const tagsAtEnd = expandTags.filter(tag => {
      const tagString = `+${tag.name}`;
      const tagWithParams = tag.params && Object.keys(tag.params).length > 0 
        ? `+${tag.name}(${Object.entries(tag.params).map(([k, v]) => `${k}=${v}`).join(',')})`
        : tagString;
      
      return isTagAtEnd(mockTask.text, tagWithParams);
    });
    
    if (tagsAtEnd.length > 0) {
      // Expand the task
      const expandedSteps = await expandTask(mockTask);
      
      // If expansion was successful, prepare expanded tasks
      if (expandedSteps && expandedSteps.length > 0) {
        // Format expanded steps as task lines
        expandedSteps.forEach(step => {
          tasksToInsert.push(`- [ ] ${step}`);
        });
      } else {
        // If expansion failed, just add the original task
        tasksToInsert.push(`- [ ] ${taskText}`);
      }
    } else {
      // Tags found but not at the end of the task, just add the original task
      tasksToInsert.push(`- [ ] ${taskText}`);
    }
  } else {
    // No expansion tags, just add the original task
    tasksToInsert.push(`- [ ] ${taskText}`);
  }
  
  // Insert the tasks at the determined position
  for (let i = 0; i < tasksToInsert.length; i++) {
    lines.splice(insertionIndex + i, 0, tasksToInsert[i]);
  }
  
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
    let issueNumber = options.issue || issues[0].issueNumber;
    
    // Find the issue - pad to 4 digits for issue numbers like "0001"
    const paddedNumber = issueNumber.toString().padStart(4, '0');
    const issue = issues.find(i => i.issueNumber === paddedNumber);
    
    if (!issue) {
      throw new IssueNotFoundError(issueNumber)
        .withDisplayMessage(`Issue #${issueNumber} not found`);
    }
    
    // Make sure issue.path exists or construct it
    const issuePath = issue.path || getIssueFilePath(issue.issueNumber);
    
    // Read the issue content
    const issueContent = await readIssue(issuePath);
    
    // Create a mock task object to extract expansion tags
    const mockTask = { text: taskText, completed: false, index: -1 };
    const tags = extractExpandTagsFromTask(mockTask);
    
    // Validate expansion tags
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
    
    // Insert the task (and any expanded subtasks)
    const updatedContent = await insertTaskIntoContent(issueContent, taskText, position);
    
    // Write the updated issue
    await writeIssue(issuePath, updatedContent);
    
    // Check if the task had expansion tags for a more informative message
    const tagCheckTask = { text: taskText, completed: false, index: -1 };
    const taskTags = extractExpandTagsFromTask(tagCheckTask);
    
    // Check if the tags are at the end of the task text
    const tagsAtEnd = taskTags.filter(tag => {
      const tagString = `+${tag.name}`;
      const tagWithParams = tag.params && Object.keys(tag.params).length > 0 
        ? `+${tag.name}(${Object.entries(tag.params).map(([k, v]) => `${k}=${v}`).join(',')})`
        : tagString;
      
      return isTagAtEnd(tagCheckTask.text, tagWithParams);
    });
    
    if (tagsAtEnd && tagsAtEnd.length > 0) {
      output.success(`Task added to issue ${issue.issueNumber} with expanded subtasks from tags: ${tagsAtEnd.map(t => t.name).join(', ')}`);
    } else {
      output.success(`Task added to issue ${issue.issueNumber} at position: ${position}`);
    }
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
  const command = new Command('add-task')
    .alias('add')
    .description('Add a new task to an issue')
    .argument('<task-text>', 'Text of the task to add (use quotes, include expansion tags with + at the end)')
    .option('-i, --issue <issueNumber>', 'Issue number to add task to (defaults to first open issue)')
    .option('-b, --before', 'Add task before the current task')
    .option('-a, --after', 'Add task after the current task')
    .action(addTaskAction);
    
  // Add rich help text
  command.addHelpText('after', `
Description:
  Adds a new task to an issue's Tasks section. By default, the task is added at
  the end of the task list, but can be positioned before or after the current task.
  
  Tasks can include expansion tags (prefixed with +) that will automatically expand
  the task into multiple subtasks based on predefined templates.

Examples:
  # Add a simple task to the current issue
  $ issue-cards add-task "Implement user authentication"
  
  # Add a task to a specific issue
  $ issue-cards add-task "Fix login redirect bug" -i 2
  
  # Add a task before the current task
  $ issue-cards add-task "Set up database connection" --before
  
  # Add a task after the current task
  $ issue-cards add-task "Add error handling" --after
  
  # Add a task with expansion tags
  $ issue-cards add-task "Create User model +unit-test"
  $ issue-cards add-task "Implement login page +unit-test +update-docs"
  
  # Using the shorter alias
  $ issue-cards add "Deploy to production +lint-and-commit"

Task Expansion:
  When a task includes a +tag at the end, the task will be expanded into multiple
  subtasks based on the tag's template. For example, "+unit-test" might expand to:
  - Write failing unit tests
  - Run tests to verify they fail
  - Implement the feature
  - Run tests to verify they pass
  - Ensure test coverage is adequate
  
  Task tags must be at the end of the task text to be properly expanded.

Available Tags:
  The built-in tags include unit-test, e2e-test, update-docs, and lint-and-commit.
  Run 'issue-cards help task-tags' for more information about available tags.

Related Commands:
  $ issue-cards current      # Show the current task
  $ issue-cards complete     # Mark the current task as complete
  $ issue-cards templates    # List available templates including tags
  `);
    
  return command;
}

module.exports = {
  createCommand,
  addTaskAction, // Exported for testing
  insertTaskIntoContent, // Exported for testing
  findInsertionLineNumber, // Exported for testing
  findTasksSectionEnd, // Exported for testing
  validateTags, // Exported for testing
};