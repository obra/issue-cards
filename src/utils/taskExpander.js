// ABOUTME: Task expansion utilities
// ABOUTME: Expands tasks based on their tags

const { extractTagsFromTask } = require('./taskParser');
const { loadTemplate, validateTemplate, getTemplateList } = require('./template');
const Handlebars = require('handlebars');

/**
 * Extract steps from a tag template
 * 
 * @param {string} tagName - Name of the tag template
 * @param {boolean} includePlaceholders - Whether to include placeholders in the response
 * @returns {Promise<Array<string>|Object>} List of steps from the template or steps and placeholders
 */
async function extractTagSteps(tagName, includePlaceholders = false) {
  try {
    // Load the tag template
    const templateContent = await loadTemplate(tagName, 'tag');
    
    // Parse the content to extract steps
    const steps = [];
    const placeholders = new Set();
    const lines = templateContent.split('\n');
    let inStepsSection = false;
    
    for (const line of lines) {
      // Check if we're entering the Steps section
      if (line.trim() === '## Steps') {
        inStepsSection = true;
        continue;
      }
      
      // Check if we're leaving the Steps section
      if (inStepsSection && line.trim().startsWith('#')) {
        inStepsSection = false;
        continue;
      }
      
      // If we're in the Steps section and this is a list item
      if (inStepsSection && line.trim().startsWith('-')) {
        // Extract the step text (remove the list marker)
        const step = line.trim().substring(1).trim();
        steps.push(step);
        
        // Extract placeholders if requested
        if (includePlaceholders) {
          const matches = step.match(/{{([^}]+)}}/g);
          
          if (matches) {
            matches.forEach(match => {
              // Extract the placeholder name (remove {{ and }})
              const placeholder = match.substring(2, match.length - 2).trim();
              placeholders.add(placeholder);
            });
          }
        }
      }
    }
    
    // Return appropriate result based on includePlaceholders flag
    if (includePlaceholders) {
      return {
        steps,
        placeholders: Array.from(placeholders)
      };
    }
    
    return steps;
  } catch (error) {
    // If we can't load the template, return empty steps
    if (includePlaceholders) {
      return { steps: [], placeholders: [] };
    }
    return [];
  }
}

/**
 * Combine task with tag steps
 * 
 * @param {string} taskText - Original task text
 * @param {Array<string>} tagSteps - Steps from the tag template
 * @param {Object} placeholderValues - Values for placeholders in steps
 * @returns {Array<string>} Combined steps
 */
function combineSteps(taskText, tagSteps, placeholderValues = {}) {
  // If there are no tag steps, just return the original task
  if (!tagSteps || tagSteps.length === 0) {
    return [taskText];
  }
  
  // Process placeholders in steps if provided
  const processedSteps = tagSteps.map(step => {
    // Skip processing if no placeholders or step is the placeholder itself
    if (step === '[ACTUAL TASK GOES HERE]' || !placeholderValues || Object.keys(placeholderValues).length === 0) {
      return step;
    }
    
    // Use Handlebars to render placeholders
    try {
      const template = Handlebars.compile(step);
      return template(placeholderValues);
    } catch (error) {
      // If rendering fails, return the original step
      return step;
    }
  });
  
  // Find the placeholder for the actual task
  const placeholderIndex = processedSteps.findIndex(step => 
    step === '[ACTUAL TASK GOES HERE]');
  
  // If no placeholder found, append the task at the end
  if (placeholderIndex === -1) {
    return [...processedSteps, taskText];
  }
  
  // Replace the placeholder with the actual task
  const combinedSteps = [...processedSteps];
  combinedSteps[placeholderIndex] = taskText;
  
  return combinedSteps;
}

/**
 * Validate a tag template structure
 * 
 * @param {string} tagName - Name of the tag template
 * @returns {Promise<Object>} Validation result with valid flag and errors
 */
async function validateTagTemplate(tagName) {
  try {
    // Load the tag template
    const templateContent = await loadTemplate(tagName, 'tag');
    
    const errors = [];
    
    // Check for Steps section
    if (!templateContent.includes('## Steps')) {
      errors.push('Template must have a Steps section');
    }
    
    // Check for task placeholder
    if (!templateContent.includes('[ACTUAL TASK GOES HERE]')) {
      errors.push('Template must have a [ACTUAL TASK GOES HERE] placeholder in Steps');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['Template not found']
    };
  }
}

/**
 * Get merged steps from multiple tag templates
 * 
 * @param {Array<string|Object>} tags - Array of tag names or tag objects
 * @returns {Promise<Array<string>>} Merged steps from all tag templates
 */
async function getMergedTagSteps(tags) {
  if (!tags || tags.length === 0) {
    return [];
  }
  
  // Process each tag and collect steps
  const allTagSteps = [];
  
  for (const tag of tags) {
    // Get tag name (may be string or object)
    const tagName = typeof tag === 'string' ? tag : tag.name;
    
    // Validate the tag template exists
    const isValid = await validateTemplate(tagName, 'tag');
    
    if (isValid) {
      // Extract steps from the tag template
      const tagSteps = await extractTagSteps(tagName);
      
      if (tagSteps.length > 0) {
        allTagSteps.push(tagSteps);
      }
    }
  }
  
  // If no valid tag steps found, return empty array
  if (allTagSteps.length === 0) {
    return [];
  }
  
  // If only one tag, return its steps
  if (allTagSteps.length === 1) {
    return allTagSteps[0];
  }
  
  // Merge multiple tag steps
  const mergedSteps = [];
  let hasAddedTaskPlaceholder = false;
  
  // Process steps from all tags
  for (const tagSteps of allTagSteps) {
    for (const step of tagSteps) {
      // Handle task placeholder (only include once)
      if (step === '[ACTUAL TASK GOES HERE]') {
        if (!hasAddedTaskPlaceholder) {
          mergedSteps.push(step);
          hasAddedTaskPlaceholder = true;
        }
      } else {
        // Add any other step
        mergedSteps.push(step);
      }
    }
  }
  
  // If no task placeholder was found, add it at the beginning
  if (!hasAddedTaskPlaceholder) {
    mergedSteps.unshift('[ACTUAL TASK GOES HERE]');
  }
  
  return mergedSteps;
}

/**
 * Expand a task based on its tags
 * 
 * @param {Object} task - Task object with text, completed, and index
 * @returns {Promise<Array<string>>} Expanded steps for the task
 */
async function expandTask(task) {
  // Extract tags from the task
  const tags = extractTagsFromTask(task);
  
  // If no tags, just return the task text
  if (!tags || tags.length === 0) {
    return [task.text];
  }
  
  // Get a clean version of the task text (without tags)
  // Remove all tags from the task text (format: #tagname or #tagname(params))
  const cleanTaskText = task.text.replace(/#[a-zA-Z0-9-]+(?:\([^)]+\))?/g, '').trim();
  
  // If there's only one tag, handle it directly
  if (tags.length === 1) {
    const tag = tags[0];
    
    // Validate the tag template exists
    const tagExists = await validateTemplate(tag.name, 'tag');
    
    if (tagExists) {
      // Extract steps from the tag template
      const tagSteps = await extractTagSteps(tag.name);
      
      // Combine steps with task text and apply any parameters
      if (tagSteps.length > 0) {
        return combineSteps(cleanTaskText, tagSteps, tag.params);
      }
    }
    
    // If tag doesn't exist or has no steps, return just the task
    return [cleanTaskText];
  }
  
  // Handle multiple tags
  const tagNames = tags.map(tag => tag.name);
  const mergedSteps = await getMergedTagSteps(tagNames);
  
  // Combine parameters from all tags
  const combinedParams = {};
  tags.forEach(tag => {
    Object.assign(combinedParams, tag.params);
  });
  
  // Combine steps with task text and parameters
  if (mergedSteps.length > 0) {
    return combineSteps(cleanTaskText, mergedSteps, combinedParams);
  }
  
  // If no valid tag steps, return just the task
  return [cleanTaskText];
}

/**
 * Create expanded task list for all tasks
 * 
 * @param {Array<Object>} tasks - List of task objects
 * @returns {Promise<Array<Object>>} List of tasks with their expanded steps
 */
async function createExpandedTaskList(tasks) {
  if (!tasks || tasks.length === 0) {
    return [];
  }
  
  // Process each task
  const expandedList = [];
  
  for (const task of tasks) {
    // Expand the task steps
    const expandedSteps = await expandTask(task);
    
    // Add to list with original task and expanded steps
    expandedList.push({
      originalTask: task,
      expandedSteps
    });
  }
  
  return expandedList;
}

module.exports = {
  extractTagSteps,
  combineSteps,
  expandTask,
  validateTagTemplate,
  getMergedTagSteps,
  createExpandedTaskList,
};