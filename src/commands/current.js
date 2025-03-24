// ABOUTME: Implementation of the 'current' command
// ABOUTME: Shows the current task with context and expanded steps

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { listIssues } = require('../utils/issueManager');
const { extractTasks, findCurrentTask } = require('../utils/taskParser');
const { expandTask } = require('../utils/taskExpander');
const { 
  formatCommand, 
  formatTask, 
  formatContext,
  formatSection,
  formatSuccess,
  formatError
} = require('../utils/output');

/**
 * Extract context from an issue's content
 * 
 * @param {string} content - Issue content
 * @returns {Object} Context object with problem, failed approaches, and instructions
 */
function extractContext(content) {
  const context = {
    problem: '',
    failed: [],
    instructions: ''
  };
  
  // Simple section extraction
  const sections = {
    'Problem to be solved': (text) => { context.problem = text; },
    'Failed approaches': (text) => { 
      context.failed = text
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
      console.error(formatError('Issue tracking is not initialized. Run `issue-cards init` first.'));
      return;
    }
    
    // Get open issues
    const issues = await listIssues();
    
    if (issues.length === 0) {
      console.error(formatError('No open issues found.'));
      return;
    }
    
    // Use the first issue as the current one
    const currentIssue = issues[0];
    
    // Extract tasks from the issue
    const tasks = await extractTasks(currentIssue.content);
    
    // Find the current (first uncompleted) task
    const currentTask = findCurrentTask(tasks);
    
    if (!currentTask) {
      console.log(formatSuccess('All tasks completed in this issue!'));
      return;
    }
    
    // Expand task based on tags
    const expandedSteps = await expandTask(currentTask);
    
    // Extract context from the issue
    const context = extractContext(currentIssue.content);
    
    // Build output
    const output = [];
    
    // Show command and task
    output.push(formatCommand('issue-cards current'));
    output.push(formatTask(currentTask.text));
    
    // Show context
    output.push(formatContext(context));
    
    // Show expanded tasks
    output.push(formatSection('TASKS', expandedSteps.map((step, i) => `${i + 1}. ${step}`)));
    
    // Show upcoming tasks
    const upcomingTasks = tasks
      .filter(task => task.index > currentTask.index)
      .map(task => task.text);
      
    if (upcomingTasks.length > 0) {
      output.push(formatSection('UPCOMING TASKS', upcomingTasks));
      output.push('Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.');
    }
    
    // Display output
    console.log(output.join('\n'));
  } catch (error) {
    console.error(formatError(`Failed to show current task: ${error.message}`));
  }
}

/**
 * Create the current command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('current')
    .description('Show current task with context')
    .action(currentAction);
}

module.exports = {
  createCommand,
  currentAction, // Exported for testing
  extractContext, // Exported for testing
};