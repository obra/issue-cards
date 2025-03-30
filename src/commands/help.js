// ABOUTME: Help command for providing interactive CLI documentation
// ABOUTME: Includes specialized help topics like environment variables

const { Command } = require('commander');
const outputManager = require('../utils/outputManager');
const fs = require('fs');
const path = require('path');

/**
 * Display help for environment variables
 */
function showEnvironmentVariablesHelp() {
  outputManager.header('Issue Cards Environment Variables');
  outputManager.info('Environment variables allow you to configure Issue Cards without command-line arguments.');
  outputManager.empty();
  
  // Core configuration variables
  outputManager.subheader('Core Configuration');
  outputManager.keyValue('ISSUE_CARDS_DIR', 'Directory to store issues and templates');
  outputManager.detail('Default: .issues in current working directory');
  outputManager.detail('Example: export ISSUE_CARDS_DIR=/path/to/custom/issues');
  outputManager.empty();
  
  // MCP server variables
  outputManager.subheader('MCP Server Configuration');
  outputManager.keyValue('ISSUE_CARDS_MCP_PORT', 'Port for the MCP server');
  outputManager.detail('Default: 3000');
  outputManager.detail('Example: ISSUE_CARDS_MCP_PORT=8080 issue-cards serve');
  outputManager.empty();
  
  outputManager.keyValue('ISSUE_CARDS_MCP_HOST', 'Host to bind the MCP server to');
  outputManager.detail('Default: localhost');
  outputManager.detail('Example: ISSUE_CARDS_MCP_HOST=0.0.0.0 issue-cards serve');
  outputManager.empty();
  
  outputManager.keyValue('ISSUE_CARDS_MCP_TOKEN', 'Authentication token for the MCP server');
  outputManager.detail('Default: None (authentication disabled)');
  outputManager.detail('Example: ISSUE_CARDS_MCP_TOKEN=my-secret-token issue-cards serve');
  outputManager.empty();
  
  outputManager.keyValue('ISSUE_CARDS_MCP_CORS', 'Enable CORS for the MCP server');
  outputManager.detail('Default: false');
  outputManager.detail('Example: ISSUE_CARDS_MCP_CORS=true issue-cards serve');
  outputManager.empty();
  
  // Testing configuration
  outputManager.subheader('Testing Configuration');
  outputManager.keyValue('NODE_ENV', 'Application environment');
  outputManager.detail('Values: development, production, test');
  outputManager.detail('Example: NODE_ENV=test issue-cards list');
  outputManager.empty();
  
  outputManager.keyValue('E2E_COLLECT_COVERAGE', 'Enable code coverage collection for E2E tests');
  outputManager.detail('Default: false');
  outputManager.detail('Example: E2E_COLLECT_COVERAGE=true npm run test:e2e');
  outputManager.empty();
  
  // Link to detailed documentation
  outputManager.subheader('Detailed Documentation');
  outputManager.info('For complete details on all environment variables, see:');
  outputManager.info('https://github.com/issue-cards/issue-cards/blob/main/docs/environment-variables.md');
}

/**
 * Display general help or help for a specific topic
 * 
 * @param {string} topic - The help topic to display
 */
function showHelp(topic) {
  if (topic === 'env') {
    showEnvironmentVariablesHelp();
  } else {
    outputManager.error(`Unknown help topic: ${topic}`);
    outputManager.info('Available topics:');
    outputManager.list(['env - Environment variables']);
  }
}

/**
 * Execute the help command action
 * 
 * @param {string} topic - The help topic to display
 */
function helpAction(topic) {
  if (topic) {
    showHelp(topic);
  } else {
    outputManager.error('Please specify a help topic');
    outputManager.info('Available topics:');
    outputManager.list(['env - Environment variables']);
  }
}

/**
 * Create the help command
 * 
 * @returns {Command} The help command
 */
function createCommand() {
  const command = new Command('help');
  
  command
    .description('Display help for specific topics')
    .argument('<topic>', 'The topic to display help for')
    .action(helpAction);
  
  return command;
}

module.exports = { createCommand, helpAction };