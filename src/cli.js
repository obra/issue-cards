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
  return program
    .name('issue-cards')
    .description('AI-Optimized Command Line Issue Tracking Tool')
    .version(require('../package.json').version)
    .addHelpCommand(true)
    .showHelpAfterError(true)
    .exitOverride((err) => {
      // Custom handling for commander exit
      if (err.code === 'commander.helpDisplayed') {
        process.exit(0);
      }
      
      if (err.code === 'commander.unknownCommand') {
        console.error(`Unknown command: ${err.message}`);
        process.exit(1);
      }
      
      throw err;
    });
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