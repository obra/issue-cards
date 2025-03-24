// ABOUTME: Template utilities for loading and rendering templates
// ABOUTME: Handles Handlebars template operations for issues and tags

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { getIssueDirectoryPath } = require('./directory');

// Register Handlebars helpers
Handlebars.registerHelper('list', function(items, options) {
  const itemsAsHtml = items.map(item => `- ${item}`).join('\n');
  return new Handlebars.SafeString(itemsAsHtml);
});

/**
 * Get the path to a template file
 * 
 * @param {string} name - Template name
 * @param {string} type - Template type ('issue' or 'tag')
 * @returns {string} Path to the template file
 */
function getTemplatePath(name, type) {
  if (type !== 'issue' && type !== 'tag') {
    throw new Error(`Invalid template type: ${type}`);
  }
  
  const templateDir = getIssueDirectoryPath(`config/templates/${type}`);
  return path.join(templateDir, `${name}.md`);
}

/**
 * Load a template file
 * 
 * @param {string} name - Template name
 * @param {string} type - Template type ('issue' or 'tag')
 * @returns {Promise<string>} Template content
 */
async function loadTemplate(name, type) {
  try {
    const templatePath = getTemplatePath(name, type);
    return await fs.promises.readFile(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`Template not found: ${name}.md (${type})`);
  }
}

/**
 * Render a template with data
 * 
 * @param {string} template - Template content
 * @param {Object} data - Data to render with
 * @returns {string} Rendered template
 */
function renderTemplate(template, data) {
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(data);
}

/**
 * Get a list of available templates for a type
 * 
 * @param {string} type - Template type ('issue' or 'tag')
 * @returns {Promise<string[]>} List of template names (without extension)
 */
async function getTemplateList(type) {
  if (type !== 'issue' && type !== 'tag') {
    throw new Error(`Invalid template type: ${type}`);
  }
  
  try {
    const templateDir = getIssueDirectoryPath(`config/templates/${type}`);
    const files = await fs.promises.readdir(templateDir);
    
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => path.basename(file, '.md'));
  } catch (error) {
    return [];
  }
}

/**
 * Validate that a template exists
 * 
 * @param {string} name - Template name
 * @param {string} type - Template type ('issue' or 'tag')
 * @returns {Promise<boolean>} True if template exists
 */
async function validateTemplate(name, type) {
  try {
    const templatePath = getTemplatePath(name, type);
    await fs.promises.access(templatePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getTemplatePath,
  loadTemplate,
  renderTemplate,
  getTemplateList,
  validateTemplate,
};