// ABOUTME: Helper functions for E2E tests
// ABOUTME: Provides shared functionality for running CLI commands quietly, with optional coverage support

const path = require('path');
const fs = require('fs');
const { execSync, spawnSync } = require('child_process');

/**
 * Base function for running commands quietly without coverage
 * This is used internally to avoid recursion issues
 * 
 * @param {string} command - The CLI command to run
 * @param {Object} options - Options for execSync
 * @returns {Object} The result with stdout, stderr, and status
 */
function runQuietlyBase(command, options = {}) {
  // Always override stdio to ensure we capture but don't display output
  const execOptions = {
    encoding: 'utf8',
    // Capture stdio but don't output to the console
    stdio: ['ignore', 'pipe', 'pipe'],
    // Merge with provided options, but don't allow stdio to be overridden
    ...options,
    stdio: ['ignore', 'pipe', 'pipe']
  };

  try {
    const stdout = execSync(command, execOptions);
    return { stdout, stderr: '', status: 0 };
  } catch (error) {
    // For testing, we want to capture the error output
    return {
      stdout: error.stdout ? error.stdout.toString() : '',
      stderr: error.stderr ? error.stderr.toString() : '',
      status: error.status || 1
    };
  }
}

/**
 * Run a CLI command quietly, capturing output but not displaying it
 * 
 * @param {string} command - The CLI command to run
 * @param {Object} options - Options for execSync
 * @returns {Object} The result with stdout, stderr, and status
 */
function runQuietly(command, options = {}) {
  // Check if we should collect coverage (can be enabled via E2E_COLLECT_COVERAGE env var)
  if (process.env.E2E_COLLECT_COVERAGE === 'true' && command.includes('node')) {
    return runWithCoverage(command, options);
  }

  return runQuietlyBase(command, options);
}

/**
 * Run a CLI command with coverage instrumentation using nyc (Istanbul)
 * This function collects coverage data from subprocesses by wrapping the command with nyc
 * 
 * @param {string} command - The CLI command to run (must be a Node.js command)
 * @param {Object} options - Command options
 * @returns {Object} The result with stdout, stderr, and status
 */
function runWithCoverage(command, options = {}) {
  // Parse the command to extract the Node.js part and the args
  const parts = command.split(' ');
  const nodeIndex = parts.findIndex(part => part.includes('node'));
  
  if (nodeIndex === -1) {
    console.warn('runWithCoverage can only be used with Node.js commands, falling back to runQuietly');
    // Use execSync directly to avoid infinite recursion
    return runQuietlyBase(command, options);
  }
  
  // Check if this command already includes nyc to avoid infinite recursion
  if (command.includes('nyc ')) {
    return runQuietlyBase(command, options);
  }
  
  // Get the script part (everything after 'node')
  const scriptWithArgs = parts.slice(nodeIndex + 1).join(' ');
  
  // Create the nyc command
  // --silent to avoid nyc output
  // --no-clean to avoid removing coverage between test runs
  // --temp-dir to use a temp directory for nyc caches
  // --report-dir to direct reports to the Jest coverage directory
  const nycBin = path.resolve(__dirname, '../../node_modules/.bin/nyc');
  
  const nycCommand = `${nycBin} --silent --no-clean --temp-dir=./coverage/.nyc_output --report-dir=./coverage -- ${scriptWithArgs}`;
  
  // Run the command with nyc, using the base function to avoid recursion
  return runQuietlyBase(nycCommand, options);
}

/**
 * Execute a CLI command and validate the result
 * 
 * @param {string} command - The CLI command to run
 * @param {function} validator - Function to validate the result
 * @param {Object} options - Options for execSync
 * @returns {Object} The validation result
 */
function expectCommand(command, validator, options = {}) {
  const result = runQuietly(command, options);
  return validator(result);
}

/**
 * Set up a test environment with a temporary directory
 * 
 * @returns {string} The path to the temporary test directory
 */
function setupTestEnvironment() {
  // Create a temporary directory for tests
  const testDir = path.join(__dirname, '..', '..', 'temp-test-' + Date.now());
  fs.mkdirSync(testDir, { recursive: true });
  
  // Change to the test directory
  process.chdir(testDir);
  
  // Create basic directory structure for issue-cards
  const issuesDir = path.join(testDir, '.issues');
  fs.mkdirSync(path.join(issuesDir, 'open'), { recursive: true });
  fs.mkdirSync(path.join(issuesDir, 'closed'), { recursive: true });
  
  // Set up templates directory structure
  const configDir = path.join(issuesDir, 'config');
  fs.mkdirSync(path.join(configDir, 'templates', 'issue'), { recursive: true });
  fs.mkdirSync(path.join(configDir, 'templates', 'tag'), { recursive: true });
  
  // Set environment variable to use our test directory for issue-cards
  process.env.ISSUE_CARDS_DIR = issuesDir;
  
  return testDir;
}

/**
 * Clean up the test environment
 * 
 * @param {string} testDir - The test directory to clean up
 */
function cleanupTestEnvironment(testDir) {
  if (!testDir) return;
  
  // Reset environment variables
  delete process.env.ISSUE_CARDS_DIR;
  
  // Important: Change back to the original directory before deleting
  // This prevents the "ENOENT: no such file or directory, uv_cwd" error
  try {
    // Store the current directory
    const currentDir = process.cwd();
    
    // If we're in the test directory, change to the parent directory
    if (currentDir === testDir || currentDir.startsWith(testDir + path.sep)) {
      const originalDir = path.resolve(__dirname, '..', '..');
      process.chdir(originalDir);
    }
    
    // Now it's safe to delete the directory
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error cleaning up test directory: ${error.message}`);
  }
}

module.exports = {
  runQuietly,
  runQuietlyBase,
  expectCommand,
  runWithCoverage,
  setupTestEnvironment,
  cleanupTestEnvironment
};