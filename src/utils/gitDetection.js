// ABOUTME: Git repository detection and availability utilities
// ABOUTME: Provides functions to check git availability and detect git repositories

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Checks if git is available on the system
 * @returns {boolean} true if git is available, false otherwise
 */
function isGitAvailable() {
  try {
    execSync('git --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a given directory is within a git repository
 * Will check parent directories recursively until root
 * @param {string} [dirPath=process.cwd()] - Directory to check
 * @returns {Promise<boolean>} true if directory is in a git repository
 */
async function isGitRepository(dirPath = process.cwd()) {
  let currentPath = dirPath;
  
  // Traverse up to filesystem root if needed
  while (currentPath !== path.parse(currentPath).root) {
    try {
      const gitDir = path.join(currentPath, '.git');
      await fs.promises.access(gitDir, fs.constants.F_OK);
      return true;
    } catch (error) {
      // If .git doesn't exist, try parent directory
      currentPath = path.dirname(currentPath);
    }
  }
  
  // No git repository found
  return false;
}

/**
 * Gets the root directory of the git repository
 * @param {string} [dirPath=process.cwd()] - Directory to start searching from
 * @returns {Promise<string|null>} Path to git repository root or null if not found
 */
async function getGitRoot(dirPath = process.cwd()) {
  let currentPath = dirPath;
  
  // Traverse up to filesystem root if needed
  while (currentPath !== path.parse(currentPath).root) {
    try {
      const gitDir = path.join(currentPath, '.git');
      await fs.promises.access(gitDir, fs.constants.F_OK);
      return currentPath;
    } catch (error) {
      // If .git doesn't exist, try parent directory
      currentPath = path.dirname(currentPath);
    }
  }
  
  // No git repository found
  return null;
}

module.exports = {
  isGitAvailable,
  isGitRepository,
  getGitRoot
};