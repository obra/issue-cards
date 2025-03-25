// ABOUTME: Implementation of the 'init' command
// ABOUTME: Initializes the issue tracking directory structure

const { Command } = require('commander');
const { isInitialized, createDirectoryStructure } = require('../utils/directory');
const { copyDefaultTemplates } = require('../utils/templateInit');
const { formatSuccess, formatError } = require('../utils/output');

/**
 * Action handler for the init command
 */
async function initAction() {
  try {
    // Check if already initialized
    const initialized = await isInitialized();
    
    if (initialized) {
      console.log(formatSuccess('Issue tracking is already initialized in this project'));
      return;
    }
    
    // Create directory structure
    await createDirectoryStructure();
    
    // Copy default templates
    await copyDefaultTemplates();
    
    console.log(formatSuccess('Initialized issue tracking system in .issues/'));
    console.log(formatSuccess('Created config templates'));
    console.log(formatSuccess('Ready to create your first issue'));
  } catch (error) {
    console.error(formatError(`Failed to initialize issue tracking: ${error.message}`));
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