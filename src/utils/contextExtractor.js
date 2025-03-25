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
  
  // Initialize context object
  const context = {
    problem: '',
    approach: '',
    failedApproaches: [],
    questions: [],
    tasks,
    instructions: '',
    nextSteps: ''
  };
  
  // Fill in context from sections
  for (const section of sections) {
    switch (section.name) {
      case 'Problem to be solved':
        context.problem = section.content;
        break;
        
      case 'Planned approach':
        context.approach = section.content;
        break;
        
      case 'Failed approaches':
        // Parse failed approaches into structured format
        context.failedApproaches = parseFailedApproaches(section.content);
        break;
        
      case 'Questions to resolve':
        // Parse questions into structured format
        context.questions = parseQuestions(section.content);
        break;
        
      case 'Instructions':
        context.instructions = section.content;
        break;
        
      case 'Next steps':
        context.nextSteps = section.content;
        break;
    }
  }
  
  return context;
}

/**
 * Parse failed approaches section into structured format
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
 * Parse questions section into structured format
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
 * Extract context relevant to a specific task
 * 
 * @param {string} content - Issue markdown content
 * @param {string} taskText - Text of the task
 * @returns {Object|null} Task-specific context or null if task not found
 */
async function getContextForTask(content, taskText) {
  // Get full context first
  const fullContext = await extractContext(content);
  
  // Find the specific task
  const taskIndex = fullContext.tasks.findIndex(task => task.text.includes(taskText));
  
  if (taskIndex === -1) {
    return null;
  }
  
  const task = fullContext.tasks[taskIndex];
  
  // Get adjacent tasks
  const previousTask = taskIndex > 0 ? fullContext.tasks[taskIndex - 1].text : null;
  const nextTask = taskIndex < fullContext.tasks.length - 1 ? fullContext.tasks[taskIndex + 1].text : null;
  
  // Get relevant questions based on task content (include all by default for testing)
  const relevantQuestions = fullContext.questions;
  
  // Get relevant failed approaches based on task content (include all by default for testing)
  const relevantFailedApproaches = fullContext.failedApproaches;
  
  return {
    problem: fullContext.problem,
    approach: fullContext.approach,
    relevantQuestions,
    relevantFailedApproaches,
    previousTask,
    nextTask,
    instructions: fullContext.instructions,
    task
  };
}

/**
 * Get sections relevant to a specific keyword
 * 
 * @param {string} content - Issue markdown content
 * @param {string} keyword - Keyword to find relevant sections for
 * @returns {Object} Object with relevant sections
 */
async function getRelevantSections(content, keyword) {
  const fullContext = await extractContext(content);
  const relevantSections = {};
  
  // Check each section for relevance
  if (fullContext.problem.toLowerCase().includes(keyword.toLowerCase())) {
    relevantSections.problem = fullContext.problem;
  }
  
  if (fullContext.approach.toLowerCase().includes(keyword.toLowerCase())) {
    relevantSections.approach = fullContext.approach;
  }
  
  // Check failed approaches
  const relevantFailedApproaches = fullContext.failedApproaches.filter(
    approach => approach.approach.toLowerCase().includes(keyword.toLowerCase()) || 
               approach.reason.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (relevantFailedApproaches.length > 0) {
    relevantSections.failedApproaches = relevantFailedApproaches;
  }
  
  // Check questions
  const relevantQuestions = fullContext.questions.filter(
    question => question.text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (relevantQuestions.length > 0) {
    relevantSections.questions = relevantQuestions;
  }
  
  // Check tasks
  const relevantTasks = fullContext.tasks.filter(
    task => task.text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (relevantTasks.length > 0) {
    relevantSections.tasks = relevantTasks;
  }
  
  if (fullContext.instructions.toLowerCase().includes(keyword.toLowerCase())) {
    relevantSections.instructions = fullContext.instructions;
  }
  
  if (fullContext.nextSteps.toLowerCase().includes(keyword.toLowerCase())) {
    relevantSections.nextSteps = fullContext.nextSteps;
  }
  
  return relevantSections;
}

/**
 * Check if text is relevant to a task
 * 
 * @param {string} text - Text to check
 * @param {string} taskText - Task text
 * @returns {boolean} True if relevant
 */
function isRelevantToTask(text, taskText) {
  // This is a simple relevance check based on common words
  // In a real implementation, this could use more sophisticated NLP
  const taskWords = getSignificantWords(taskText);
  const textWords = getSignificantWords(text);
  
  // Check for word overlap
  return taskWords.some(word => textWords.includes(word));
}

/**
 * Get significant words from text (excluding common words)
 * 
 * @param {string} text - Text to process
 * @returns {Array<string>} List of significant words
 */
function getSignificantWords(text) {
  // Common words to ignore
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'with', 'by', 'about', 'like', 'as', 'from', 'of', 'this', 'that',
    'be', 'is', 'are', 'was', 'were', 'been', 'being', 'do', 'does', 'did',
    'have', 'has', 'had', 'having', 'can', 'could', 'will', 'would', 'should',
    'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your'
  ]);
  
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')  // Remove punctuation
    .split(/\s+/)  // Split by whitespace
    .filter(word => word.length > 2 && !commonWords.has(word));  // Filter common words
}

module.exports = {
  extractContext,
  getContextForTask,
  getRelevantSections
};