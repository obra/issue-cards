// ABOUTME: Template validation utilities
// ABOUTME: Validates template structure and content

const fs = require('fs');
const { getTemplatePath } = require('./template');

/**
 * Required sections for issue templates
 */
const REQUIRED_ISSUE_SECTIONS = [
  'Problem to be solved',
  'Planned approach',
  'Failed approaches', 
  'Questions to resolve',
  'Tasks',
  'Instructions',
  'Next steps'
];

/**
 * Required variables for issue templates
 */
const REQUIRED_ISSUE_VARIABLES = [
  '{NUMBER}',
  '{TITLE}',
  '{PROBLEM}',
  '{APPROACH}',
  '{FAILED_APPROACHES}',
  '{QUESTIONS}',
  '{TASKS}',
  '{INSTRUCTIONS}',
  '{NEXT_STEPS}'
];

/**
 * Required sections for tag templates
 */
const REQUIRED_TAG_SECTIONS = ['Steps'];

/**
 * Validate the structure of a template
 * 
 * @param {string} name - Template name
 * @param {string} type - Template type ('issue' or 'tag')
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
async function validateTemplateStructure(name, type) {
  const errors = [];
  
  try {
    // Get template path and read content
    const templatePath = getTemplatePath(name, type);
    const content = await fs.promises.readFile(templatePath, 'utf8');
    
    // Check template structure based on type
    if (type === 'issue') {
      validateIssueTemplateStructure(content, errors);
    } else if (type === 'tag') {
      validateTagTemplateStructure(content, errors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Template file could not be read: ${error.message}`]
    };
  }
}

/**
 * Validate issue template structure
 * 
 * @param {string} content - Template content
 * @param {string[]} errors - Array to collect errors
 */
function validateIssueTemplateStructure(content, errors) {
  // Check for required sections
  for (const section of REQUIRED_ISSUE_SECTIONS) {
    if (!content.includes(`## ${section}`)) {
      errors.push(`Missing required section: ${section}`);
    }
  }
  
  // Check for required variables
  for (const variable of REQUIRED_ISSUE_VARIABLES) {
    if (!content.includes(variable)) {
      errors.push(`Missing variable placeholder: ${variable}`);
    }
  }
}

/**
 * Validate tag template structure
 * 
 * @param {string} content - Template content
 * @param {string[]} errors - Array to collect errors
 */
function validateTagTemplateStructure(content, errors) {
  // Check for required sections
  for (const section of REQUIRED_TAG_SECTIONS) {
    if (!content.includes(`## ${section}`)) {
      errors.push(`Missing required section: ${section}`);
    }
  }
  
  // Check for task placeholder
  if (!content.includes('[ACTUAL TASK GOES HERE]')) {
    errors.push('Tag template does not contain [ACTUAL TASK GOES HERE] placeholder');
  }
}

module.exports = {
  validateTemplateStructure,
  REQUIRED_ISSUE_SECTIONS,
  REQUIRED_ISSUE_VARIABLES,
  REQUIRED_TAG_SECTIONS
};