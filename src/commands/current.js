// ABOUTME: Implementation of the 'current' command
// ABOUTME: Shows the current task with context and expanded steps

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { listIssues } = require('../utils/issueManager');
const { extractTasks, findCurrentTask } = require('../utils/taskParser');
const { expandTask } = require('../utils/taskExpander');
// Output manager is used for all output
const output = require('../utils/outputManager');
const { UninitializedError } = require('../utils/errors');

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
    failed: [],
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
      throw new UninitializedError();
    }
    
    // Get open issues
    const issues = await listIssues();
    
    if (issues.length === 0) {
      output.error('No open issues found.');
      return;
    }
    
    // Use the first issue as the current one
    const currentIssue = issues[0];
    
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
    
    // Show task header with appropriate styling
    output.section('TASK', currentTask.text);
    
    // Show current task separately
    output.section('CURRENT TASK', currentTask.text);
    
    // Show expanded task steps if available
    if (expandedSteps && expandedSteps.length > 0) {
      const stepsText = expandedSteps.map((step, idx) => `${idx + 1}. ${step}`);
      output.section('TASKS', stepsText);
    }
    
    // Show context as individual sections
    if (context.problem) {
      output.section('Problem to be solved', context.problem);
    }
    
    if (context.approach) {
      output.section('Planned approach', context.approach);
    }
    
    if (context.failed && context.failed.length > 0) {
      output.section('Failed approaches', context.failed);
    }
    
    if (context.questions && context.questions.length > 0) {
      output.section('Questions to resolve', context.questions);
    }
    
    if (context.instructions) {
      output.section('Instructions', context.instructions);
    }
    
    // Show next task
    const nextTask = tasks.find(task => task.index === currentTask.index + 1);
    if (nextTask) {
      output.section('NEXT TASK', nextTask.text);
    }
    
    // Show upcoming tasks
    const upcomingTasks = tasks
      .filter(task => task.index > currentTask.index + 1)
      .map(task => task.text);
      
    if (upcomingTasks.length > 0) {
      output.section('UPCOMING TASKS', upcomingTasks);
      output.info('Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.');
    }
  } catch (error) {
    if (error instanceof UninitializedError) {
      output.error(error.message, error.recoveryHint);
    } else {
      output.error(`Failed to show current task: ${error.message}`);
    }
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