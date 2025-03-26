// ABOUTME: Context extraction utilities for issues
// ABOUTME: Extracts relevant context for tasks from issue files

const { getSections, getSectionContent } = require('./sectionManager');
const { extractTasks } = require('./taskParser');

/**
 * Extract full context from issue content
 * 
 * @param {string} content - Issue markdown content
 * @returns {Object} Context object with all sections
 */
async function extractContext(content) {
  // Extract tasks using existing task parser
  const tasks = await extractTasks(content);
  
  // Get all sections
  const sections = getSections(content);
  
  // Initialize context object with tasks
  const context = { tasks };
  
  // Fill in context from sections - just use raw content
  for (const section of sections) {
    // Use section name as key, content as value
    context[section.name] = section.content;
  }
  
  return context;
}

/**
 * Parse questions section into structured format
 * This function is kept for backwards compatibility but simplified
 * 
 * @param {string} content - Questions section content
 * @returns {Array<Object>} List of questions with text and completion status
 */
function parseQuestions(content) {
  if (!content) return [];
  
  const questions = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if this is a task item
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
      const completed = trimmed.startsWith('- [x]');
      const text = trimmed.substring(completed ? 6 : 6).trim();
      
      questions.push({ text, completed });
    }
  }
  
  return questions;
}

/**
 * Parse failed approaches section into structured format
 * This function is kept for backwards compatibility but simplified
 * 
 * @param {string} content - Failed approaches section content
 * @returns {Array<Object>} List of failed approaches with approach and reason
 */
function parseFailedApproaches(content) {
  if (!content) return [];
  
  const approaches = [];
  const attemptSections = content.split('### Failed attempt');
  
  // Skip the first entry if it's empty (before the first heading)
  for (let i = 1; i < attemptSections.length; i++) {
    const section = attemptSections[i].trim();
    if (!section) continue;
    
    // Split the approach from the reason
    const parts = section.split('**Reason:**');
    const approach = parts[0].trim();
    const reason = parts.length > 1 ? parts[1].trim() : 'Not specified';
    
    approaches.push({ approach, reason });
  }
  
  return approaches;
}

/**
 * Get context that includes a specific task
 * Simple alternative to the removed getContextForTask function
 * 
 * @param {string} content - Issue markdown content
 * @param {string} taskText - Text of the task
 * @returns {Object|null} Context that includes the task or null if task not found
 */
async function getBasicTaskContext(content, taskText) {
  const context = await extractContext(content);
  const task = context.tasks.find(t => t.text.includes(taskText));
  
  if (!task) {
    return null;
  }
  
  return { ...context, task };
}

/**
 * Find sections that contain specific text
 * Simple alternative to the removed getRelevantSections function
 * 
 * @param {Object} context - Context object from extractContext
 * @param {string} searchText - Text to search for
 * @returns {Object} Object with sections that contain the search text
 */
function findSectionsWithText(context, searchText) {
  const searchTextLower = searchText.toLowerCase();
  const relevantSections = {};
  
  // Simple text matching on section contents
  Object.entries(context).forEach(([name, content]) => {
    if (typeof content === 'string' && content.toLowerCase().includes(searchTextLower)) {
      relevantSections[name] = content;
    }
  });
  
  return relevantSections;
}

module.exports = {
  extractContext,
  // Provide backwards compatibility aliases
  getContextForTask: getBasicTaskContext,
  getRelevantSections: async function(content, keyword) {
    const context = await extractContext(content);
    return findSectionsWithText(context, keyword);
  }
};