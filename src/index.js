// ABOUTME: Main entry point for the Issue Cards tool
// ABOUTME: Initializes and executes the CLI program

const { createProgram } = require('./cli');
const outputManager = require('./utils/outputManager');
const { IssueCardsError } = require('./utils/errors');

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

// Execute the main function
if (require.main === module) {
  main();
}

module.exports = main;