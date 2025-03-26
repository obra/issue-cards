// ABOUTME: Command for listing and viewing templates
// ABOUTME: Handles template display and management

const { Command } = require('commander');
const { isInitialized } = require('../utils/directory');
const { getTemplateList, loadTemplate, validateTemplate } = require('../utils/template');
const { validateTemplateStructure } = require('../utils/templateValidation');
const output = require('../utils/outputManager');
const { UninitializedError, TemplateNotFoundError, UserError, IssueCardsError, SystemError } = require('../utils/errors');

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
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // If a specific template name is provided, show that template
    if (options.name) {
      await showTemplate(options.name, options.type, options.validate);
      return;
    }
    
    // Otherwise, list templates
    await listTemplates(options.type, options.validate);
  } catch (error) {
    if (error instanceof IssueCardsError) {
      // If error already has a display message, use it; otherwise create one
      if (!error.displayMessage) {
        const hint = error.recoveryHint ? ` (${error.recoveryHint})` : '';
        error.withDisplayMessage(`${error.message}${hint}`);
      }
      throw error;
    } else {
      // Wrap generic errors in a SystemError
      throw new SystemError(`Failed to list templates: ${error.message}`)
        .withDisplayMessage(`Failed to list templates: ${error.message}`);
    }
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
      
      output.section('Available issue templates', '');
      
      if (validate) {
        await Promise.all(issueTemplates.map(async name => {
          await printTemplateWithValidation(name, 'issue');
        }));
      } else {
        const formattedList = issueTemplates.map(name => `${name}`);
        output.list(formattedList);
      }
      output.blank();
      
      output.section('Available tag templates', '');
      
      if (validate) {
        await Promise.all(tagTemplates.map(async name => {
          await printTemplateWithValidation(name, 'tag');
        }));
      } else {
        const formattedList = tagTemplates.map(name => `${name}`);
        output.list(formattedList);
      }
      output.blank();
      
      // Show usage information
      showUsageInfo();
      return;
    }
    
    // Show templates for the specified type
    const templates = await getTemplateList(type);
    output.section(`Available ${type} templates`, '');
    
    if (validate) {
      await Promise.all(templates.map(async name => {
        await printTemplateWithValidation(name, type);
      }));
    } else {
      const formattedList = templates.map(name => `${name}`);
      output.list(formattedList);
    }
    output.blank();
    
    // Show usage information
    showUsageInfo(type);
  } catch (error) {
    if (error instanceof IssueCardsError) {
      throw error; // Rethrow IssueCardsError with existing context
    } else {
      // Wrap other errors in SystemError with display message
      throw new SystemError(`Failed to list templates: ${error.message}`)
        .withDisplayMessage(`Failed to list templates: ${error.message}`);
    }
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
      output.success(`${name} is valid`);
    } else {
      output.error(`${name} is invalid`);
      
      // Print validation errors indented
      validation.errors.forEach(error => {
        output.warn(`  ${error}`);
      });
    }
  } catch (error) {
    // Only catch and log validation errors here since this is a subfunction
    // used within listTemplates. Validation failures are not critical errors.
    output.error(`${name} validation failed: ${error.message}`);
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
    throw new UserError('You must specify type when viewing a template')
      .withRecoveryHint('Use --type issue or --type tag')
      .withDisplayMessage('You must specify type when viewing a template (Use --type issue or --type tag)');
  }
  
  try {
    // Validate that the template exists
    const exists = await validateTemplate(name, type);
    if (!exists) {
      throw new TemplateNotFoundError(`${name} (${type})`)
        .withRecoveryHint(`Run 'issue-cards templates' to see available templates`)
        .withDisplayMessage(`Template not found: ${name} (${type}) (Run 'issue-cards templates' to see available templates)`);
    }
    
    // Load and display the template
    const content = await loadTemplate(name, type);
    output.section(`Template: ${name} (${type})`, '');
    
    // Validate template structure if requested
    if (validate) {
      const validation = await validateTemplateStructure(name, type);
      
      if (validation.valid) {
        output.success('Template structure is valid');
      } else {
        output.error('Template structure has errors:');
        validation.errors.forEach(error => {
          output.warn(`  ${error}`);
        });
        output.blank();
      }
    }
    
    output.raw(content);
    output.blank();
    
    // Show usage information
    output.section('Usage', '');
    if (type === 'issue') {
      output.info(`issue-cards create -t ${name}`);
    } else if (type === 'tag') {
      output.info(`issue-cards add-task "Task with #${name} tag"`);
    }
  } catch (error) {
    if (error instanceof IssueCardsError) {
      // Just rethrow IssueCardsError (it will already have display message set)
      throw error;
    } else {
      // Wrap other errors in UserError with display message
      throw new UserError(`Failed to show template: ${error.message}`)
        .withDisplayMessage(`Failed to show template: ${error.message}`);
    }
  }
}

/**
 * Show usage information
 * 
 * @param {string} [type] - Template type
 */
function showUsageInfo(type) {
  output.section('Usage', '');
  
  if (!type || type === 'issue') {
    output.info('View issue template:');
    output.raw('issue-cards templates -t issue -n <template-name>');
    output.info('Create new issue from template:');
    output.raw('issue-cards create -t <template-name>');
    output.blank();
  }
  
  if (!type || type === 'tag') {
    output.info('View tag template:');
    output.raw('issue-cards templates -t tag -n <template-name>');
    output.info('Add task with tag:');
    output.raw('issue-cards add-task "Task with #<template-name> tag"');
  }
}

module.exports = {
  createCommand,
  templatesAction,
};