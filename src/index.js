// ABOUTME: Main entry point for the Issue Cards tool
// ABOUTME: Initializes and executes the CLI program

const { createProgram } = require('./cli');

/**
 * Main function to run the CLI application
 */
async function main() {
  try {
    const program = await createProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Execute the main function
if (require.main === module) {
  main();
}

module.exports = main;