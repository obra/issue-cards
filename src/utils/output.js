// ABOUTME: Output formatting utilities for the CLI
// ABOUTME: Standardizes output format for commands and information

const chalk = require('chalk');

/**
 * Format a command header
 * 
 * @param {string} command - The command that was executed
 * @returns {string} - Formatted command header
 */
function formatCommand(command) {
  return `${chalk.bold('COMMAND: ' + command)}\n\n`;
}

/**
 * Format a task header
 * 
 * @param {string} task - The task description
 * @returns {string} - Formatted task header
 */
function formatTask(task) {
  return `${chalk.bold('TASK: ' + task)}\n\n`;
}

/**
 * Format a section with header and content
 * 
 * @param {string} title - The section title
 * @param {string|string[]} content - The section content
 * @returns {string} - Formatted section
 */
function formatSection(title, content) {
  const header = chalk.bold(`${title}:`);
  
  if (!content || (Array.isArray(content) && content.length === 0)) {
    return `${header}\n`;
  }
  
  if (Array.isArray(content)) {
    return `${header}\n${content.map(item => `${item}`).join('\n')}\n`;
  }
  
  return `${header}\n${content}\n`;
}

/**
 * Format context information from an issue
 * 
 * @param {Object} context - Context object with section keys
 * @returns {string} - Formatted context
 */
function formatContext(context) {
  const sections = [];
  
  sections.push(chalk.bold('CONTEXT:') + '\n');
  
  if (context.problem) {
    sections.push(formatSection('Problem to be solved', context.problem));
  }
  
  if (context.approach) {
    sections.push(formatSection('Planned approach', context.approach));
  }
  
  if (context.failed && context.failed.length > 0) {
    sections.push(formatSection('Failed approaches', context.failed));
  }
  
  if (context.questions && context.questions.length > 0) {
    sections.push(formatSection('Questions to resolve', context.questions));
  }
  
  if (context.instructions) {
    sections.push(formatSection('Instructions', context.instructions));
  }
  
  return sections.join('\n');
}

/**
 * Format a success message
 * 
 * @param {string} message - The success message
 * @returns {string} - Formatted success message
 */
function formatSuccess(message) {
  return `${chalk.green('✅ ' + message)}\n`;
}

/**
 * Format an error message
 * 
 * @param {string} message - The error message
 * @returns {string} - Formatted error message
 */
function formatError(message) {
  return `${chalk.red('❌ ' + message)}\n`;
}

/**
 * Format a list of items
 * 
 * @param {string[]} items - The items to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.numbered - Whether to use numbered list (default: false)
 * @returns {string} - Formatted list
 */
function formatList(items, options = {}) {
  if (!items || items.length === 0) {
    return '';
  }
  
  return items
    .map((item, index) => {
      if (options.numbered) {
        return `${index + 1}. ${item}`;
      }
      return `- ${item}`;
    })
    .join('\n');
}

/**
 * Format an informational message
 * 
 * @param {string} message - The informational message
 * @returns {string} - Formatted informational message
 */
function formatInfo(message) {
  return `${chalk.blue('ℹ️ ' + message)}\n`;
}

module.exports = {
  formatCommand,
  formatTask,
  formatSection,
  formatContext,
  formatSuccess,
  formatError,
  formatList,
  formatInfo,
};