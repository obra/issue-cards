// ABOUTME: Helper functions for E2E tests
// ABOUTME: Provides shared functionality for running CLI commands quietly, with optional coverage support

const path = require('path');
const fs = require('fs');
const { execSync, spawnSync } = require('child_process');

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
 * Run a CLI command with coverage instrumentation
 * This is an advanced function that should only be used when trying to collect coverage
 * from subprocess execution.
 * 
 * @param {string} command - The CLI command to run (must be a Node.js command)
 * @param {Object} options - Command options
 * @returns {Object} The result with stdout, stderr, and status
 */
function runWithCoverage(command, options = {}) {
  // Parse the command to extract the Node.js part and the script to run
  const parts = command.split(' ');
  const nodeIndex = parts.findIndex(part => part.includes('node'));
  
  if (nodeIndex === -1) {
    console.warn('runWithCoverage can only be used with Node.js commands, falling back to runQuietly');
    return runQuietly(command, options);
  }
  
  // Get the actual script path (should be the part after 'node')
  const scriptPath = parts[nodeIndex + 1];
  const args = parts.slice(nodeIndex + 2);
  
  // Always override stdio to ensure we capture but don't display output
  const execOptions = {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
    stdio: ['ignore', 'pipe', 'pipe'],
  };

  try {
    // Use Node's --enable-source-maps flag for better coverage reporting
    const result = spawnSync('node', ['--enable-source-maps', scriptPath, ...args], execOptions);
    
    return {
      stdout: result.stdout ? result.stdout.toString() : '',
      stderr: result.stderr ? result.stderr.toString() : '',
      status: result.status || 0
    };
  } catch (error) {
    return {
      stdout: '',
      stderr: error.message || 'Error running command',
      status: 1
    };
  }
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

module.exports = {
  runQuietly,
  expectCommand,
  runWithCoverage
};