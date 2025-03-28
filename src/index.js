// ABOUTME: Main entry point for the Issue Cards tool
// ABOUTME: Initializes and executes the CLI program

const { createProgram } = require('./cli');
const outputManager = require('./utils/outputManager');
const { IssueCardsError, SystemError } = require('./utils/errors');

/**
 * Main function to run the CLI application
 */
async function main() {
  // Parse global args for verbosity/output options
  const globalArgs = parseGlobalArgs(process.argv);
  
  // Configure output manager based on flags
  outputManager.configure({
    quiet: globalArgs.quiet,
    verbose: globalArgs.verbose,
    debug: globalArgs.debug,
    noColor: globalArgs.noColor,
    json: globalArgs.json
  });
  
  try {
    const program = await createProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    // Handle different error types
    if (error instanceof IssueCardsError) {
      // Use the pre-formatted display message if available
      const message = error.displayMessage || 
                  `${error.message}${error.recoveryHint ? ` (${error.recoveryHint})` : ''}`;
      
      // Only display the error if it hasn't been displayed already
      if (!error.displayed) {
        outputManager.error(message);
        error.markDisplayed();
      }
      
      process.exit(error.code);
    } else {
      // For unexpected errors
      outputManager.error(`Unexpected error: ${error.message}`);
      
      // Show stack trace in debug mode
      if (globalArgs.debug) {
        outputManager.debug(error.stack);
      }
      
      process.exit(1);
    }
  }
}

/**
 * Parse global arguments that affect output
 * 
 * @param {string[]} argv - Command line arguments
 * @returns {Object} Parsed global arguments
 */
function parseGlobalArgs(argv) {
  const args = {
    quiet: argv.includes('--quiet') || argv.includes('-q'),
    verbose: argv.includes('--verbose') || argv.includes('-v'),
    debug: argv.includes('--debug') || argv.includes('-d'),
    noColor: argv.includes('--no-color'),
    json: argv.includes('--json')
  };
  
  // Debug overrides verbose which overrides quiet
  if (args.debug) args.verbose = true;
  if (args.quiet && (args.verbose || args.debug)) args.quiet = false;
  
  return args;
}

/**
 * Execute a CLI command programmatically
 * 
 * @param {string} commandName - The name of the command to execute
 * @param {Object} args - Arguments for the command
 * @returns {Promise<Object>} The command execution result
 */
async function executeCommand(commandName, args = {}) {
  try {
    // Force JSON output
    const execArgs = { ...args, json: true };
    
    // Configure output manager for programmatic execution
    outputManager.configure({ 
      json: true, 
      quiet: true,
      suppressConsole: args.suppressConsole || false,
      commandName: commandName
    });
    
    // Create the program
    const program = await createProgram();
    
    // Find the command
    const command = program.commands.find(cmd => cmd.name() === commandName);
    
    if (!command) {
      throw new SystemError(`Unknown command: ${commandName}`)
        .withDisplayMessage(`Unknown command: ${commandName}`);
    }
    
    // Execute the command action directly
    await command.parseOptions([]);
    const action = command._actionHandler;
    await action(execArgs, command);
    
    // Get the command-specific output if available, or fall back to global output
    const output = outputManager.getCommandOutput(commandName) || outputManager.getCapturedOutput();
    
    // Format the output if requested
    const formattedOutput = args.outputFormat
      ? outputManager.transformOutput(output, args.outputFormat)
      : output;
    
    // Reset command output
    outputManager.resetCommandOutput(commandName);
    
    // Reset global output manager
    outputManager.reset();
    
    return {
      success: true,
      data: formattedOutput
    };
  } catch (error) {
    // Reset output manager
    outputManager.reset();
    
    if (error instanceof IssueCardsError) {
      return {
        success: false,
        error: {
          code: error.code,
          type: error.constructor.name,
          message: error.displayMessage || error.message,
          hint: error.recoveryHint
        }
      };
    }
    
    // For unexpected errors
    return {
      success: false,
      error: {
        type: 'UnexpectedError',
        message: error.message,
        stack: error.stack
      }
    };
  }
}

// Execute the main function
if (require.main === module) {
  main();
}

// Create a proper module.exports pattern
module.exports = main;
module.exports.main = main; 
module.exports.executeCommand = executeCommand;