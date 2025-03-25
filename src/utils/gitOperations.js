// ABOUTME: Git operations utilities
// ABOUTME: Provides safe git operation functions with error handling

const { execSync } = require('child_process');
const { isGitAvailable } = require('./gitDetection');

/**
 * Safely executes a git command after checking git availability
 * @param {string} command - The git subcommand to run
 * @param {string[]} [args=[]] - Arguments for the git command
 * @param {Object} [options={}] - Options to pass to execSync
 * @returns {Promise<string>} Command output
 * @throws {Error} If git is not available or command fails
 */
async function safelyExecuteGit(command, args = [], options = {}) {
  if (!isGitAvailable()) {
    throw new Error('Git is not available on this system');
  }

  // Format arguments into a string
  const argsString = args.length > 0 ? ' ' + args.join(' ') : '';
  
  // Create full command string
  const fullCommand = `git ${command}${argsString}`;
  
  // Default options
  const execOptions = {
    encoding: 'utf8',
    ...options
  };
  
  try {
    // Ensure we're getting a string, not a Buffer
    const result = execSync(fullCommand, execOptions);
    return result.toString().trim();
  } catch (error) {
    throw error;
  }
}

/**
 * Get git status of the repository
 * @param {Object} [options={}] - Options for git command execution
 * @returns {Promise<string>} Git status output
 */
async function gitStatus(options = {}) {
  return safelyExecuteGit('status', [], options);
}

/**
 * Stage file(s) for git commit
 * @param {string|string[]} [filePaths] - File path(s) to stage, stages all changes if not provided
 * @param {Object} [options={}] - Options for git command execution
 * @returns {Promise<string>} Command output
 */
async function gitStage(filePaths, options = {}) {
  let args = [];
  
  if (!filePaths) {
    // Stage all changes if no paths specified
    args = ['-A'];
  } else if (Array.isArray(filePaths)) {
    // Format multiple files with quotes to handle spaces
    args = filePaths.map(file => `"${file}"`);
  } else {
    // Single file path
    args = [`"${filePaths}"`];
  }
  
  return safelyExecuteGit('add', args, options);
}

/**
 * List tracked files in the git repository
 * @param {string} [pattern] - Optional file pattern to filter results
 * @param {Object} [options={}] - Options for git command execution
 * @returns {Promise<string[]>} Array of tracked file paths
 */
async function gitShowTrackedFiles(pattern, options = {}) {
  const args = [];
  
  // Add pattern filter if provided
  if (pattern) {
    args.push('--', `"${pattern}"`);
  }
  
  const output = await safelyExecuteGit('ls-files', args, options);
  
  // Return as array of file paths, filtering out empty lines
  return output.split('\n').filter(Boolean);
}

module.exports = {
  safelyExecuteGit,
  gitStatus,
  gitStage,
  gitShowTrackedFiles
};