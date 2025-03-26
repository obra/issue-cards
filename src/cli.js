// ABOUTME: Main CLI configuration and command loading
// ABOUTME: Sets up Commander.js and loads all command modules

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

/**
 * Configure the commander program with global settings
 * 
 * @param {Command} program - The commander program instance
 * @returns {Command} The configured program
 */
function configureCommander(program) {
  // Capture version and help actions so we can properly handle output
  const packageVersion = require('../package.json').version;
  
  // Build program with commander's methods
  const configuredProgram = program
    .name('issue-cards')
    .description('AI-Optimized Command Line Issue Tracking Tool')
    .version(packageVersion, '-V, --version', 'Output the version number')
    .addHelpCommand(true)
    .showHelpAfterError(true)
    .exitOverride((err) => {
      // Custom handling for commander exit
      if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
        // Help and version are success cases, exit cleanly
        process.exit(0);
      }
      
      if (err.code === 'commander.unknownCommand') {
        // Create a proper IssueCardsError
        const { UserError } = require('./utils/errors');
        const error = new UserError(`Unknown command: ${err.message}`);
        error.withDisplayMessage(`Unknown command: ${err.message}`);
        throw error;
      }
      
      throw err;
    });
  
  // Return the configured program
  return configuredProgram;
}

/**
 * Load all command modules from the commands directory
 * 
 * @param {Command} program - The commander program instance
 * @returns {Promise<void>}
 */
async function loadCommands(program) {
  const commandsDir = path.join(__dirname, 'commands');
  const files = await fs.promises.readdir(commandsDir);
  
  for (const file of files) {
    if (file.endsWith('.js')) {
      const commandName = path.basename(file, '.js');
      const commandModule = require(path.join(commandsDir, file));
      
      if (typeof commandModule.createCommand === 'function') {
        const command = commandModule.createCommand();
        program.addCommand(command);
      }
    }
  }
}

/**
 * Create and configure the program
 * 
 * @returns {Promise<Command>} The configured commander program
 */
async function createProgram() {
  const program = new Command();
  configureCommander(program);
  await loadCommands(program);
  return program;
}

module.exports = {
  configureCommander,
  loadCommands,
  createProgram,
};