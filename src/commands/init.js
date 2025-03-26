// ABOUTME: Implementation of the 'init' command
// ABOUTME: Initializes the issue tracking directory structure

const { Command } = require('commander');
const { isInitialized, createDirectoryStructure } = require('../utils/directory');
const { copyDefaultTemplates } = require('../utils/templateInit');
const output = require('../utils/outputManager');
const { SystemError } = require('../utils/errors');

/**
 * Action handler for the init command
 */
async function initAction() {
  try {
    // Check if already initialized
    const initialized = await isInitialized();
    
    if (initialized) {
      output.success('Issue tracking is already initialized in this project');
      return;
    }
    
    // Create directory structure
    await createDirectoryStructure();
    
    // Copy default templates
    await copyDefaultTemplates();
    
    output.success('Initialized issue tracking system in .issues/');
    output.success('Created config templates');
    output.success('Ready to create your first issue');
  } catch (error) {
    throw new SystemError(`Failed to initialize issue tracking: ${error.message}`)
      .withDisplayMessage(`Failed to initialize issue tracking: ${error.message}`);
  }
}

/**
 * Create the init command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('init')
    .description('Initialize issue tracking in this project')
    .action(initAction);
}

module.exports = {
  createCommand,
  initAction, // Exported for testing
};