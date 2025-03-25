// ABOUTME: Command for listing and viewing templates
// ABOUTME: Handles template display and management

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { getTemplateList, loadTemplate, validateTemplate } = require('../utils/template');
const { validateTemplateStructure } = require('../utils/templateValidation');
const { formatSuccess, formatError, formatInfo, formatCommand, formatWarning } = require('../utils/output');

/**
 * Create the templates command
 * 
 * @returns {Command} Templates command
 */
function createCommand() {
  const command = new Command('templates')
    .description('List or view available templates')
    .option('-t, --type <type>', 'Template type (issue or tag)')
    .option('-n, --name <name>', 'Template name to display')
    .option('-v, --validate', 'Validate template structure')
    .action(templatesAction);
  
  return command;
}

/**
 * Templates command action
 * 
 * @param {Object} options - Command options
 * @param {string} [options.type] - Template type
 * @param {string} [options.name] - Template name
 * @param {boolean} [options.validate] - Validate template structure
 * @returns {Promise<void>}
 */
async function templatesAction(options) {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    if (!initialized) {
      console.error(formatError('Issue tracking is not initialized. Run `issue-cards init` first.'));
      return;
    }
    
    // If a specific template name is provided, show that template
    if (options.name) {
      await showTemplate(options.name, options.type, options.validate);
      return;
    }
    
    // Otherwise, list templates
    await listTemplates(options.type, options.validate);
  } catch (error) {
    console.error(formatError(`Error: ${error.message}`));
  }
}

/**
 * List available templates
 * 
 * @param {string} [type] - Template type
 * @param {boolean} [validate] - Validate template structure
 * @returns {Promise<void>}
 */
async function listTemplates(type, validate) {
  try {
    // If no type is specified, show both issue and tag templates
    if (!type) {
      const issueTemplates = await getTemplateList('issue');
      const tagTemplates = await getTemplateList('tag');
      
      console.log(formatInfo('Available issue templates:'));
      
      if (validate) {
        await Promise.all(issueTemplates.map(async name => {
          await printTemplateWithValidation(name, 'issue');
        }));
      } else {
        issueTemplates.forEach(name => console.log(`  - ${name}`));
      }
      console.log('');
      
      console.log(formatInfo('Available tag templates:'));
      
      if (validate) {
        await Promise.all(tagTemplates.map(async name => {
          await printTemplateWithValidation(name, 'tag');
        }));
      } else {
        tagTemplates.forEach(name => console.log(`  - ${name}`));
      }
      console.log('');
      
      // Show usage information
      showUsageInfo();
      return;
    }
    
    // Show templates for the specified type
    const templates = await getTemplateList(type);
    console.log(formatInfo(`Available ${type} templates:`));
    
    if (validate) {
      await Promise.all(templates.map(async name => {
        await printTemplateWithValidation(name, type);
      }));
    } else {
      templates.forEach(name => console.log(`  - ${name}`));
    }
    console.log('');
    
    // Show usage information
    showUsageInfo(type);
  } catch (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }
}

/**
 * Print template name with validation status
 * 
 * @param {string} name - Template name
 * @param {string} type - Template type
 * @returns {Promise<void>}
 */
async function printTemplateWithValidation(name, type) {
  try {
    const validation = await validateTemplateStructure(name, type);
    
    if (validation.valid) {
      console.log(`  - ${name} ${formatSuccess('[valid]')}`);
    } else {
      console.log(`  - ${name} ${formatError('[invalid]')}`);
      
      // Print validation errors indented
      validation.errors.forEach(error => {
        console.log(`      ${formatWarning(error)}`);
      });
    }
  } catch (error) {
    console.log(`  - ${name} ${formatError('[validation failed]')}`);
  }
}

/**
 * Show a specific template
 * 
 * @param {string} name - Template name
 * @param {string} type - Template type
 * @param {boolean} [validate] - Validate template structure
 * @returns {Promise<void>}
 */
async function showTemplate(name, type, validate) {
  // Require type to be specified
  if (!type) {
    console.error(formatError('You must specify type when viewing a template'));
    return;
  }
  
  try {
    // Validate that the template exists
    const exists = await validateTemplate(name, type);
    if (!exists) {
      console.error(formatError(`Template ${name} (${type}) not found`));
      return;
    }
    
    // Load and display the template
    const content = await loadTemplate(name, type);
    console.log(formatInfo(`Template: ${name} (${type})`));
    
    // Validate template structure if requested
    if (validate) {
      const validation = await validateTemplateStructure(name, type);
      
      if (validation.valid) {
        console.log(formatSuccess('Template structure is valid'));
      } else {
        console.log(formatError('Template structure has errors:'));
        validation.errors.forEach(error => {
          console.log(`  ${formatWarning(error)}`);
        });
        console.log('');
      }
    }
    
    console.log(content);
    console.log('');
    
    // Show usage information
    if (type === 'issue') {
      console.log(formatInfo('Usage:'));
      console.log(formatCommand(`issue-cards create -t ${name}`));
    } else if (type === 'tag') {
      console.log(formatInfo('Usage:'));
      console.log(formatCommand(`issue-cards add-task "Task with #${name} tag"`));
    }
  } catch (error) {
    throw new Error(`Failed to show template: ${error.message}`);
  }
}

/**
 * Show usage information
 * 
 * @param {string} [type] - Template type
 */
function showUsageInfo(type) {
  console.log(formatInfo('Usage:'));
  
  if (!type || type === 'issue') {
    console.log(formatCommand('issue-cards templates -t issue -n <template-name>'));
    console.log(formatCommand('issue-cards create -t <template-name>'));
  }
  
  if (!type || type === 'tag') {
    console.log(formatCommand('issue-cards templates -t tag -n <template-name>'));
    console.log(formatCommand('issue-cards add-task "Task with #<template-name> tag"'));
  }
}

module.exports = {
  createCommand,
  templatesAction,
};