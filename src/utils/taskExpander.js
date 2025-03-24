// ABOUTME: Task expansion utilities
// ABOUTME: Expands tasks based on their tags

const { extractTagsFromTask } = require('./taskParser');
const { loadTemplate, validateTemplate } = require('./template');

/**
 * Extract steps from a tag template
 * 
 * @param {string} tagName - Name of the tag template
 * @returns {Promise<Array<string>>} List of steps from the template
 */
async function extractTagSteps(tagName) {
  try {
    // Load the tag template
    const templateContent = await loadTemplate(tagName, 'tag');
    
    // Parse the content to extract steps
    const steps = [];
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
      }
    }
    
    return steps;
  } catch (error) {
    // If we can't load the template, return empty steps
    return [];
  }
}

/**
 * Combine task with tag steps
 * 
 * @param {string} taskText - Original task text
 * @param {Array<string>} tagSteps - Steps from the tag template
 * @returns {Array<string>} Combined steps
 */
function combineSteps(taskText, tagSteps) {
  // If there are no tag steps, just return the original task
  if (!tagSteps || tagSteps.length === 0) {
    return [taskText];
  }
  
  // Find the placeholder for the actual task
  const placeholderIndex = tagSteps.findIndex(step => 
    step === '[ACTUAL TASK GOES HERE]');
  
  // If no placeholder found, append the task at the end
  if (placeholderIndex === -1) {
    return [...tagSteps, taskText];
  }
  
  // Replace the placeholder with the actual task
  const combinedSteps = [...tagSteps];
  combinedSteps[placeholderIndex] = taskText;
  
  return combinedSteps;
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
  let cleanTaskText = task.text;
  for (const tag of tags) {
    cleanTaskText = cleanTaskText.replace(`#${tag}`, '').trim();
  }
  
  // Process each tag and collect all steps
  let expandedSteps = [cleanTaskText];
  
  for (const tag of tags) {
    // Validate the tag template exists
    const tagExists = await validateTemplate(tag, 'tag');
    
    if (tagExists) {
      // Extract steps from the tag template
      const tagSteps = await extractTagSteps(tag);
      
      // Combine steps with existing expansion
      if (tagSteps.length > 0) {
        expandedSteps = combineSteps(cleanTaskText, tagSteps);
      }
    }
  }
  
  return expandedSteps;
}

module.exports = {
  extractTagSteps,
  combineSteps,
  expandTask,
};