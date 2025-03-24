// ABOUTME: Template initialization utilities
// ABOUTME: Handles copying default templates to project directory

const fs = require('fs');
const path = require('path');
const { getIssueDirectoryPath } = require('./directory');

/**
 * Get the path to the default templates directory
 * 
 * @returns {string} Path to default templates directory
 */
function getDefaultTemplatesDir() {
  // Templates are included in the package
  return path.join(__dirname, '../../templates');
}

/**
 * Get the path to a default template file
 * 
 * @param {string} name - Template name
 * @param {string} type - Template type ('issue' or 'tag')
 * @returns {string} Path to the default template file
 */
function getDefaultTemplatePath(name, type) {
  if (type !== 'issue' && type !== 'tag') {
    throw new Error(`Invalid template type: ${type}`);
  }
  
  const templatesDir = getDefaultTemplatesDir();
  return path.join(templatesDir, type, `${name}.md`);
}

/**
 * Copy default templates to the project directory
 * 
 * @returns {Promise<void>}
 */
async function copyDefaultTemplates() {
  try {
    const defaultTemplatesDir = getDefaultTemplatesDir();
    const projectTemplatesDir = getIssueDirectoryPath('config/templates');
    
    // Copy issue templates
    const issueTemplatesDir = path.join(defaultTemplatesDir, 'issue');
    const projectIssueTemplatesDir = path.join(projectTemplatesDir, 'issue');
    await copyTemplatesOfType(issueTemplatesDir, projectIssueTemplatesDir);
    
    // Copy tag templates
    const tagTemplatesDir = path.join(defaultTemplatesDir, 'tag');
    const projectTagTemplatesDir = path.join(projectTemplatesDir, 'tag');
    await copyTemplatesOfType(tagTemplatesDir, projectTagTemplatesDir);
  } catch (error) {
    throw new Error(`Failed to copy default templates: ${error.message}`);
  }
}

/**
 * Copy templates of a specific type
 * 
 * @param {string} sourceDir - Source directory
 * @param {string} destDir - Destination directory
 * @returns {Promise<void>}
 */
async function copyTemplatesOfType(sourceDir, destDir) {
  try {
    const files = await fs.promises.readdir(sourceDir);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const sourceFile = path.join(sourceDir, file);
        const destFile = path.join(destDir, file);
        
        const content = await fs.promises.readFile(sourceFile, 'utf8');
        await fs.promises.writeFile(destFile, content, 'utf8');
      }
    }
  } catch (error) {
    // If the templates directory doesn't exist, log a warning but don't throw
    if (error.code === 'ENOENT') {
      console.warn(`Warning: Default templates directory not found: ${sourceDir}`);
      return;
    }
    
    throw error;
  }
}

module.exports = {
  getDefaultTemplatesDir,
  getDefaultTemplatePath,
  copyDefaultTemplates,
};