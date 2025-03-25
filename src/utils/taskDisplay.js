// ABOUTME: Utility for displaying task information
// ABOUTME: Provides consistent task display across commands

const output = require('./outputManager');

/**
 * Display task and context information
 * 
 * @param {Object} task - The task to display
 * @param {Object} context - The context information
 * @param {string} context.problem - Problem description
 * @param {string} context.approach - Planned approach
 * @param {string[]} context.failed - Failed approaches
 * @param {string[]} context.questions - Questions to resolve
 * @param {string} context.instructions - Instructions
 * @param {string[]} expandedSteps - Expanded task steps
 * @param {Object} options - Display options
 * @param {string} options.headerPrefix - Prefix for the main header (e.g., "CURRENT", "NEXT")
 */
function displayTaskWithContext(task, context, expandedSteps = [], options = {}) {
  // Default header prefix
  const headerPrefix = options.headerPrefix || 'CURRENT';
  
  // Show task header with appropriate styling
  if (headerPrefix !== 'NONE') {
    output.section(`${headerPrefix} TASK`, task.text);
  } else {
    output.section('TASK', task.text);
  }
  
  // Show expanded task steps if available
  if (expandedSteps && expandedSteps.length > 0) {
    const stepsText = expandedSteps.map((step, idx) => `${idx + 1}. ${step}`);
    output.section('TASKS', stepsText);
  }
  
  // Add CONTEXT section header to match E2E test expectations
  output.section('CONTEXT', '');
  
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
}

module.exports = {
  displayTaskWithContext
};