// ABOUTME: Task parsing utilities
// ABOUTME: Handles markdown task extraction, status tracking, and tag detection

// Import unified modules properly - using correct access to exports
const unifiedModule = require('unified');
const unified = unifiedModule.unified;
const remarkParseModule = require('remark-parse');
const remarkParse = remarkParseModule.default; // Access the default export
const remarkStringifyModule = require('remark-stringify');
const remarkStringify = remarkStringifyModule.default; // Access the default export

/**
 * Extract tasks from markdown content
 * 
 * @param {string} content - Markdown content to parse
 * @returns {Promise<Array<Object>>} List of tasks with text, status, and index
 */
async function extractTasks(content) {
  try {
    // Parse markdown into AST
    const processor = unified().use(remarkParse);
    const tree = processor.parse(content);
    
    const tasks = [];
    let inTasksSection = false;
    let taskIndex = 0;
    
    // Traverse the tree to find the Tasks section and list items within it
    for (const node of tree.children) {
      // Check if we've found the Tasks section
      if (node.type === 'heading' && 
          node.children && 
          node.children.some(child => 
            child.type === 'text' && child.value === 'Tasks')) {
        inTasksSection = true;
        continue;
      }
      
      // If we've reached another heading, we're out of the Tasks section
      if (inTasksSection && node.type === 'heading') {
        inTasksSection = false;
        continue;
      }
      
      // If we're in the Tasks section and found a list
      if (inTasksSection && node.type === 'list') {
        // Process each list item
        for (const item of node.children) {
          if (item.type === 'listItem') {
            // Check if this is a task (has checkbox)
            const paragraph = item.children.find(n => n.type === 'paragraph');
            
            if (paragraph && paragraph.children.length > 0) {
              // Check if first child is a task checkbox
              const firstChild = paragraph.children[0];
              
              if (firstChild.type === 'text' && 
                  (firstChild.value.startsWith('[ ] ') || firstChild.value.startsWith('[x] '))) {
                // This is a task item
                const completed = firstChild.value.startsWith('[x] ');
                const textStart = completed ? 4 : 4; // Skip "[x] " or "[ ] "
                
                // Combine all text content
                let text = firstChild.value.substring(textStart);
                
                // Add any additional text nodes
                for (let i = 1; i < paragraph.children.length; i++) {
                  const child = paragraph.children[i];
                  if (child.type === 'text') {
                    text += child.value;
                  }
                }
                
                // Add task to list
                tasks.push({
                  text,
                  completed,
                  index: taskIndex++
                });
              }
            }
          }
        }
      }
    }
    
    return tasks;
  } catch (error) {
    throw new Error(`Failed to parse tasks: ${error.message}`);
  }
}

/**
 * Find a task by its index
 * 
 * @param {Array<Object>} tasks - List of tasks
 * @param {number} index - Task index
 * @returns {Object|null} Task object or null if not found
 */
function findTaskByIndex(tasks, index) {
  return tasks.find(task => task.index === index) || null;
}

/**
 * Find the current (first uncompleted) task
 * 
 * @param {Array<Object>} tasks - List of tasks
 * @returns {Object|null} Current task or null if all completed
 */
function findCurrentTask(tasks) {
  return tasks.find(task => !task.completed) || null;
}

/**
 * Parse a tag string to extract name and parameters
 * 
 * @param {string} tagString - Tag string (e.g., "unit-test" or "unit-test(component=UserService)")
 * @returns {Object} Tag object with name and parameters
 */
function parseTag(tagString) {
  // Check if tag has parameters
  const paramMatch = tagString.match(/^([a-zA-Z0-9-]+)\((.+)\)$/);
  
  if (paramMatch) {
    const tagName = paramMatch[1];
    const paramString = paramMatch[2];
    const params = {};
    
    // Parse parameter string (format: key1=value1,key2=value2)
    paramString.split(',').forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim());
      if (key && value) {
        params[key] = value;
      }
    });
    
    return { name: tagName, params };
  }
  
  // No parameters
  return { name: tagString, params: {} };
}

/**
 * Extract tags from a task
 * 
 * @param {Object} task - Task object
 * @returns {Array<Object>} List of tag objects with name and parameters
 */
function extractTagsFromTask(task) {
  const tags = [];
  const tagRegex = /#([a-zA-Z0-9-]+(?:\([^)]+\))?)/g;
  let match;
  
  while ((match = tagRegex.exec(task.text)) !== null) {
    tags.push(parseTag(match[1]));
  }
  
  return tags;
}

/**
 * Extract expansion tags (with + prefix) from a task
 * 
 * @param {Object} task - Task object
 * @returns {Array<Object>} List of expansion tag objects with name and parameters
 */
function extractExpandTagsFromTask(task) {
  const tags = [];
  const tagRegex = /\+([a-zA-Z0-9-]+(?:\([^)]+\))?)/g;
  let match;
  
  while ((match = tagRegex.exec(task.text)) !== null) {
    tags.push(parseTag(match[1]));
  }
  
  return tags;
}

/**
 * Check if a tag appears at the end of the task text
 * 
 * @param {string} taskText - The task text to check
 * @param {string} tag - The tag to check for (including + prefix)
 * @returns {boolean} True if the tag is at the end of the task text
 */
function isTagAtEnd(taskText, tag) {
  // Remove the tag from the task text
  const textWithoutTag = taskText.replace(tag, '').trim();
  
  // If the resulting text is shorter and the tag was at the end,
  // then the tag was the last thing in the text
  return (
    textWithoutTag.length < taskText.length && 
    taskText.trim().endsWith(tag)
  );
}

/**
 * Extract tag names (without parameters) from a task
 * 
 * @param {Object} task - Task object
 * @returns {Array<string>} List of tag names
 */
function extractTagNamesFromTask(task) {
  return extractTagsFromTask(task).map(tag => tag.name);
}

/**
 * Check if a task has a specific tag
 * 
 * @param {Object} task - Task object
 * @param {string} tagName - Tag name to check for
 * @returns {boolean} True if task has the tag
 */
function hasTag(task, tagName) {
  const tagNames = extractTagNamesFromTask(task);
  return tagNames.includes(tagName);
}

/**
 * Get parameters for a specific tag in a task
 * 
 * @param {Object} task - Task object
 * @param {string} tagName - Tag name
 * @returns {Object|null} Tag parameters or null if tag not found
 */
function getTagParameters(task, tagName) {
  const tags = extractTagsFromTask(task);
  const tag = tags.find(t => t.name === tagName);
  return tag ? tag.params : null;
}

/**
 * Get clean task text (without tags)
 * 
 * @param {Object} task - Task object
 * @returns {string} Task text without tags
 */
function getCleanTaskText(task) {
  // Remove only +tags (expansion tags)
  // We keep #tags as they're now treated as regular text and not special expansion tags
  let cleanText = task.text
    .replace(/\+[a-zA-Z0-9-]+(?:\([^)]+\))?/g, '')
    .trim();
  
  return cleanText;
}

/**
 * Update task status in markdown content
 * 
 * @param {string} content - Markdown content
 * @param {number} taskIndex - Index of task to update
 * @param {boolean} completed - New completion status
 * @returns {Promise<string>} Updated markdown content
 */
async function updateTaskStatus(content, taskIndex, completed) {
  // First extract tasks to validate the index
  const tasks = await extractTasks(content);
  
  if (taskIndex < 0 || taskIndex >= tasks.length) {
    throw new Error('Task index out of bounds');
  }
  
  // Get the task to update
  const task = tasks[taskIndex];
  
  // Replace the task line in the content
  // We need to find the specific task in the content
  const lines = content.split('\n');
  let inTasksSection = false;
  let taskCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    // Check if we're entering the Tasks section
    if (lines[i].trim() === '## Tasks') {
      inTasksSection = true;
      continue;
    }
    
    // Check if we're leaving the Tasks section
    if (inTasksSection && lines[i].trim().startsWith('##')) {
      inTasksSection = false;
      continue;
    }
    
    // If we're in the Tasks section and this looks like a task item
    if (inTasksSection && 
        (lines[i].trim().startsWith('- [ ]') || lines[i].trim().startsWith('- [x]'))) {
      
      // If this is the task we want to update
      if (taskCount === taskIndex) {
        // Replace the status marker
        if (completed) {
          lines[i] = lines[i].replace('- [ ]', '- [x]');
        } else {
          lines[i] = lines[i].replace('- [x]', '- [ ]');
        }
        
        // Return the updated content
        return lines.join('\n');
      }
      
      taskCount++;
    }
  }
  
  throw new Error('Task not found in content');
}

module.exports = {
  extractTasks,
  findTaskByIndex,
  findCurrentTask,
  extractTagsFromTask,
  extractExpandTagsFromTask,
  extractTagNamesFromTask,
  parseTag,
  hasTag,
  getTagParameters,
  getCleanTaskText,
  updateTaskStatus,
  isTagAtEnd,
};