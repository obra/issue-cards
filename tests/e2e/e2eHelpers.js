// ABOUTME: Helper functions for E2E tests
// ABOUTME: Provides shared functionality for running CLI commands quietly

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Run a CLI command quietly, capturing output but not displaying it
 * 
 * @param {string} command - The CLI command to run
 * @param {Object} options - Options for execSync
 * @returns {Object} The result with stdout, stderr, and status
 */
function runQuietly(command, options = {}) {
  const execOptions = {
    encoding: 'utf8',
    // Capture stdio but don't output to the console
    stdio: ['ignore', 'pipe', 'pipe'],
    // Merge with provided options
    ...options
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
  expectCommand
};