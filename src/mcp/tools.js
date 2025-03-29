// ABOUTME: MCP tools for AI integration with issue-cards
// ABOUTME: Implements core functionality accessible via API

const { executeCommand } = require('../index');
const { 
  getIssues,
  getIssueByNumber,
  isValidIssueNumber,
  getCurrentIssue,
  getCurrentTask,
  addTaskToIssue
} = require('../utils/issueManager');
const {
  createValidationError,
  createNotFoundError,
  withErrorHandling
} = require('./errorHandler');
const {
  withValidation
} = require('./validator');

/**
 * List all issues
 * 
 * @param {Object} args - Command arguments
 * @param {string} [args.state] - Filter by issue state (open, closed, all)
 * @returns {Promise<Object>} MCP result object
 */
const mcp__listIssues = withValidation('mcp__listIssues',
  withErrorHandling(async (args) => {
    const issues = await getIssues(args.state);
    
    return {
      success: true,
      data: issues
    };
  }, 'listIssues')
);

/**
 * Show details of a specific issue
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.issueNumber - The issue number to show
 * @returns {Promise<Object>} MCP result object
 */
const mcp__showIssue = withValidation('mcp__showIssue', async (args) => {
  try {
    // Get issue details
    const issue = await getIssueByNumber(args.issueNumber);
    
    return {
      success: true,
      data: issue
    };
  } catch (error) {
    return createNotFoundError('Issue', args.issueNumber);
  }
});

/**
 * Get the current task
 * 
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} MCP result object with current task data
 */
const mcp__getCurrentTask = withValidation('mcp__getCurrentTask',
  withErrorHandling(async (args) => {
    // Get current issue
    const currentIssue = await getCurrentIssue();
    
    // If no current issue, return null
    if (!currentIssue) {
      return {
        success: true,
        data: null
      };
    }
    
    // Get current task for the issue
    const currentTask = await getCurrentTask();
    
    // Format the response
    const response = {
      issueNumber: currentIssue.number,
      issueTitle: currentIssue.title,
      taskId: currentTask ? currentTask.id : null,
      description: currentTask ? currentTask.description : null
    };
    
    // Include context data if available
    if (currentTask && currentTask.contextData) {
      response.context = currentTask.contextData;
    }
    
    return {
      success: true,
      data: response
    };
  }, 'getCurrentTask')
);

/**
 * Add a task to an issue
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.issueNumber - The issue number to add the task to
 * @param {string} args.description - The task description
 * @returns {Promise<Object>} MCP result object
 */
const mcp__addTask = withValidation('mcp__addTask', async (args) => {
  try {
    // Add task to the issue
    const newTask = await addTaskToIssue(args.issueNumber, args.description);
    
    return {
      success: true,
      data: newTask
    };
  } catch (error) {
    return createNotFoundError('Issue', args.issueNumber);
  }
});

module.exports = {
  mcp__listIssues,
  mcp__showIssue,
  mcp__getCurrentTask,
  mcp__addTask
};