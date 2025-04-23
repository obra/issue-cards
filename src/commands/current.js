// ABOUTME: Implementation of the 'current' command
// ABOUTME: Shows the current task with context and expanded steps

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { listIssues, getCurrentIssue } = require('../utils/issueManager');
const { extractTasks, findCurrentTask } = require('../utils/taskParser');
const { expandTask } = require('../utils/taskExpander');
const { displayTaskWithContext } = require('../utils/taskDisplay');
// Output manager is used for all output
const output = require('../utils/outputManager');
const { UninitializedError, UserError, SystemError } = require('../utils/errors');

/**
 * Extract context from an issue's content
 * 
 * @param {string} content - Issue content
 * @returns {Object} Context object with problem, failed approaches, and instructions
 */
function extractContext(content) {
  const context = {
    problem: '',
    approach: '',
    failed: [], // This will be accessed as 'failed' in the task display
    questions: [],
    instructions: ''
  };
  
  // Simple section extraction
  const sections = {
    'Problem to be solved': (text) => { context.problem = text; },
    'Planned approach': (text) => { context.approach = text; },
    'Failed approaches': (text) => { 
      // Process both list items and structured notes with ### Failed attempt
      const listItems = text
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim());
      
      // Also look for structured notes
      const structuredNotes = [];
      if (text.includes('### Failed attempt')) {
        const parts = text.split('### Failed attempt');
        for (let i = 1; i < parts.length; i++) {
          structuredNotes.push(parts[i].trim().split('\n')[0]);
        }
      }
      
      context.failed = [...listItems, ...structuredNotes];
    },
    'Questions to resolve': (text) => {
      context.questions = text
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim());
    },
    'Instructions': (text) => { context.instructions = text; }
  };
  
  // Process the content line by line
  const lines = content.split('\n');
  let currentSection = null;
  let sectionContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we've hit a new section
    if (line.startsWith('## ')) {
      // If we were in a section, process its content
      if (currentSection && sections[currentSection]) {
        sections[currentSection](sectionContent.join('\n').trim());
      }
      
      // Set the new section
      currentSection = line.substring(3).trim();
      sectionContent = [];
    } 
    // If we're in a section, collect its content
    else if (currentSection) {
      sectionContent.push(lines[i]);
    }
  }
  
  // Process the last section if needed
  if (currentSection && sections[currentSection]) {
    sections[currentSection](sectionContent.join('\n').trim());
  }
  
  return context;
}

/**
 * Action handler for the current command
 */
async function currentAction() {
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
      throw new UserError('No open issues found.')
        .withDisplayMessage('No open issues found.');
    }
    
    // Get the current issue
    const currentIssue = await getCurrentIssue();
    
    // Extract tasks from the issue
    const tasks = await extractTasks(currentIssue.content);
    
    // Find the current (first uncompleted) task
    const currentTask = findCurrentTask(tasks);
    
    if (!currentTask) {
      output.success('All tasks completed in this issue!');
      return;
    }
    
    // Expand task based on tags
    const expandedSteps = await expandTask(currentTask);
    
    // Extract context from the issue
    const context = extractContext(currentIssue.content);
    
    // Debug logging removed
    
    // Use the shared task display utility
    displayTaskWithContext(currentTask, context, expandedSteps, { headerPrefix: 'CURRENT' });
    
    // Add instruction to work on the task
    output.info('➡️ Unless you have explicit instructions to the contrary, it is now time to work on the task listed above');
    
    // Show upcoming tasks (excluding the current task)
    const upcomingTasks = tasks
      .filter(task => task.index > currentTask.index)
      .map(task => task.text);
      
    if (upcomingTasks.length > 0) {
      output.section('UPCOMING TASKS', upcomingTasks);
      output.info('Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.');
    }
  } catch (error) {
    if (error instanceof UninitializedError || error instanceof UserError) {
      // Re-throw the error with display message already set
      throw error;
    } else {
      // Wrap generic errors in a SystemError
      throw new SystemError(`Failed to show current task: ${error.message}`)
        .withDisplayMessage(`Failed to show current task: ${error.message}`);
    }
  }
}

/**
 * Create the current command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  const command = new Command('current')
    .description('Show current task with context')
    .action(currentAction);
    
  // Add rich help text
  command.addHelpText('after', `
Description:
  Displays the current task (first uncompleted task) from the current issue with
  relevant context. This command focuses on the specific task at hand rather than
  showing the entire issue content.

Examples:
  $ issue-cards current

Output sections:
  The command output includes:
  - CURRENT TASK: The first uncompleted task in the current issue
  - CONTEXT: Relevant sections from the issue (problem, approach, etc.)
  - EXPANDED STEPS: If the task has tags like +unit-test, shows expanded steps
  - UPCOMING TASKS: Preview of tasks that will come after the current task

Task expansion:
  Tasks with tags (e.g., "Implement login form +unit-test") are automatically
  expanded into multiple steps. For example, a +unit-test tag might expand to:
  1. Write failing unit tests for the feature
  2. Run tests to verify they fail as expected
  3. Implement the feature
  4. Run tests to verify they now pass

Related commands:
  $ issue-cards complete     # Mark the current task as complete
  $ issue-cards show         # Show the full issue details
  $ issue-cards add-task     # Add a new task to the issue
  
For more information about task tags:
  $ issue-cards help task-tags
  `);
    
  return command;
}

module.exports = {
  createCommand,
  currentAction, // Exported for testing
  extractContext, // Exported for testing
};