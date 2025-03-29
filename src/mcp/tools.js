// ABOUTME: MCP tools for AI integration with issue-cards
// ABOUTME: Implements core functionality accessible via API

const { executeCommand } = require('../index');
const { 
  getIssues,
  getIssueByNumber,
  isValidIssueNumber,
  getCurrentIssue,
  getCurrentTask,
  addTaskToIssue,
  getNextIssueNumber,
  saveIssue,
  getIssue,
  closeIssue
} = require('../utils/issueManager');
const {
  createValidationError,
  createNotFoundError,
  withErrorHandling
} = require('./errorHandler');
const {
  withValidation
} = require('./validator');
const { 
  loadTemplate, 
  renderTemplate, 
  validateTemplate, 
  getTemplateList 
} = require('../utils/template');
const { 
  addContentToSection, 
  findSectionByName, 
  normalizeSectionName 
} = require('../utils/sectionManager');
const { 
  extractTasks, 
  findCurrentTask, 
  updateTaskStatus 
} = require('../utils/taskParser');

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

/**
 * Create a new issue from a template
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.template - Template name to use
 * @param {string} args.title - Issue title
 * @param {string} [args.problem] - Problem description
 * @param {string} [args.approach] - Planned approach
 * @param {string} [args.failedApproaches] - Multi-line list of failed approaches
 * @param {string} [args.questions] - Multi-line list of questions
 * @param {string|string[]} [args.task] - Task or tasks to add
 * @param {string} [args.instructions] - Implementation instructions
 * @param {string} [args.nextSteps] - Multi-line list of next steps
 * @returns {Promise<Object>} MCP result object
 */
const mcp__createIssue = withValidation('mcp__createIssue',
  async (args) => {
    // Check required parameters
    if (!args.title) {
      return createValidationError('Title is required');
    }

    try {
      // Validate template exists
      const validTemplate = await validateTemplate(args.template, 'issue');
      
      if (!validTemplate) {
        return createNotFoundError('Template', args.template);
      }
      
      // Get next issue number
      const issueNumber = await getNextIssueNumber();
      
      // Load template
      const templateContent = await loadTemplate(args.template, 'issue');
    
    // Format arrays or multi-line strings as lists
    const formatAsList = (input) => {
      if (!input) return '';
      
      if (Array.isArray(input)) {
        return input
          .filter(line => line.trim())
          .map(line => `- ${line.trim()}`)
          .join('\n');
      }
      
      return input
        .split('\n')
        .filter(line => line.trim())
        .map(line => `- ${line.trim()}`)
        .join('\n');
    };
    
    // Format task input as tasks with checkboxes
    const formatAsTasks = (input) => {
      if (!input) return '';
      
      const tasks = Array.isArray(input) ? input : [input];
      
      return tasks
        .filter(task => task && task.trim())
        .map(task => {
          if (task.startsWith('- [ ]')) {
            return task.trim();
          }
          return `- [ ] ${task.trim()}`;
        })
        .join('\n');
    };
    
    // Prepare template data
    const templateData = {
      NUMBER: issueNumber,
      TITLE: args.title,
      PROBLEM: args.problem || '',
      APPROACH: args.approach || '',
      FAILED_APPROACHES: formatAsList(args.failedApproaches),
      QUESTIONS: formatAsList(args.questions),
      TASKS: formatAsTasks(args.task),
      INSTRUCTIONS: args.instructions || '',
      NEXT_STEPS: formatAsList(args.nextSteps)
    };
    
    // Render template
    const issueContent = renderTemplate(templateContent, templateData);
    
    // Save issue
    await saveIssue(issueNumber, issueContent);
    
    return {
      success: true,
      data: {
        number: issueNumber,
        title: args.title,
        template: args.template
      }
    };
  } catch (error) {
      return createValidationError(`Failed to create issue: ${error.message}`);
    }
  }
);

/**
 * Complete the current task and show the next task
 * 
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} MCP result object
 */
const mcp__completeTask = withValidation('mcp__completeTask',
  withErrorHandling(async (args) => {
    // Get the current issue
    const currentIssue = await getCurrentIssue();
    
    if (!currentIssue) {
      return createNotFoundError('Current issue');
    }
    
    // Extract tasks from the issue
    const tasks = await extractTasks(currentIssue.content);
    
    // Find the current (first uncompleted) task
    const currentTask = findCurrentTask(tasks);
    
    if (!currentTask) {
      return {
        success: false,
        error: {
          type: 'UserError',
          message: 'No tasks found or all tasks are already completed'
        }
      };
    }
    
    // Update the task status
    const updatedContent = await updateTaskStatus(
      currentIssue.content, 
      currentTask.index, 
      true
    );
    
    // Save the updated issue
    await saveIssue(currentIssue.number, updatedContent);
    
    // Check if all tasks are now completed
    const updatedTasks = await extractTasks(updatedContent);
    const nextTask = findCurrentTask(updatedTasks);
    
    // Prepare response data
    const responseData = {
      taskCompleted: currentTask.text,
      issueNumber: currentIssue.number
    };
    
    if (!nextTask) {
      // All tasks are completed, close the issue
      await closeIssue(currentIssue.number);
      responseData.nextTask = null;
      responseData.issueCompleted = true;
    } else {
      // There's a next task, include it in the response
      responseData.nextTask = {
        id: nextTask.id,
        description: nextTask.text
      };
      
      // Get the issue content to extract context
      const issueContent = await getIssue(currentIssue.number);
      
      // Extract context sections if they exist
      const extractContext = (content) => {
        const context = {};
        
        // Try to find common context sections
        const problemSection = findSectionByName(content, 'Problem to be solved');
        const approachSection = findSectionByName(content, 'Planned approach');
        const instructionsSection = findSectionByName(content, 'Instructions');
        
        if (problemSection) {
          context.problem = problemSection.content.trim();
        }
        
        if (approachSection) {
          context.approach = approachSection.content.trim();
        }
        
        if (instructionsSection) {
          context.instructions = instructionsSection.content.trim();
        }
        
        return Object.keys(context).length > 0 ? context : null;
      };
      
      const context = extractContext(issueContent);
      if (context) {
        responseData.context = context;
      }
    }
    
    return {
      success: true,
      data: responseData
    };
  }, 'completeTask')
);

/**
 * Add a note to a specific section of an issue
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.note - The note text to add
 * @param {string} args.section - Section to add the note to
 * @param {string} [args.issueNumber] - Issue number (uses current if not specified)
 * @param {string} [args.format] - Note format (blank, question, failure, task)
 * @param {string} [args.reason] - Reason for a failed approach
 * @returns {Promise<Object>} MCP result object
 */
const mcp__addNote = withValidation('mcp__addNote',
  withErrorHandling(async (args) => {
    // Use current issue if no issue number provided
    let issueNumber = args.issueNumber;
    
    if (!issueNumber) {
      const currentIssue = await getCurrentIssue();
      if (!currentIssue) {
        return {
          success: false,
          error: {
            type: 'UserError',
            message: 'No current issue found'
          }
        };
      }
      issueNumber = currentIssue.number;
    }
    
    try {
      // Get issue content
      const issueContent = await getIssue(issueNumber);
      
      // Get normalized section name
      const normalizedSection = normalizeSectionName(args.section);
      
      try {
        // Add note to the section
        const updatedContent = addContentToSection(
          issueContent, 
          normalizedSection, 
          args.note, 
          args.format,
          {
            reason: args.reason
          }
        );
        
        // Save the updated content
        await saveIssue(issueNumber, updatedContent);
        
        return {
          success: true,
          data: {
            issueNumber,
            section: normalizedSection,
            noteAdded: true
          }
        };
      } catch (sectionErr) {
        // Handle section not found specifically
        if (sectionErr.message.includes('not found')) {
          return {
            success: false,
            error: {
              type: 'SectionNotFoundError',
              message: `Section "${normalizedSection}" not found in issue`
            }
          };
        }
        throw sectionErr;
      }
    } catch (error) {
      // Handle issue not found
      return createNotFoundError('Issue', issueNumber);
    }
  }, 'addNote')
);

/**
 * Add a question to an issue
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.question - The question to add
 * @param {string} [args.issueNumber] - Issue number (uses current if not specified)
 * @returns {Promise<Object>} MCP result object
 */
const mcp__addQuestion = withValidation('mcp__addQuestion',
  withErrorHandling(async (args) => {
    // Use current issue if no issue number provided
    let issueNumber = args.issueNumber;
    
    if (!issueNumber) {
      const currentIssue = await getCurrentIssue();
      if (!currentIssue) {
        return {
          success: false,
          error: {
            type: 'UserError',
            message: 'No current issue found'
          }
        };
      }
      issueNumber = currentIssue.number;
    }
    
    try {
      // Get issue content
      const issueContent = await getIssue(issueNumber);
      
      // Check if Questions to resolve section exists
      const sectionName = 'Questions to resolve';
      const section = findSectionByName(issueContent, sectionName);
      
      if (!section) {
        return {
          success: false,
          error: {
            type: 'SectionNotFoundError',
            message: `Section "${sectionName}" not found in issue`
          }
        };
      }
      
      // Ensure the text ends with a question mark
      const formattedQuestion = args.question.endsWith('?') 
        ? args.question 
        : `${args.question}?`;
      
      // Add the question to the section
      const updatedContent = addContentToSection(
        issueContent,
        sectionName,
        formattedQuestion,
        'question'
      );
      
      // Save the updated content
      await saveIssue(issueNumber, updatedContent);
      
      return {
        success: true,
        data: {
          issueNumber,
          questionAdded: true
        }
      };
    } catch (error) {
      // Handle issue not found
      return createNotFoundError('Issue', issueNumber);
    }
  }, 'addQuestion')
);

/**
 * Log a failed approach to an issue
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.approach - Description of the failed approach
 * @param {string} [args.issueNumber] - Issue number (uses current if not specified)
 * @param {string} [args.reason] - Reason for failure
 * @returns {Promise<Object>} MCP result object
 */
const mcp__logFailure = withValidation('mcp__logFailure',
  withErrorHandling(async (args) => {
    // Use current issue if no issue number provided
    let issueNumber = args.issueNumber;
    
    if (!issueNumber) {
      const currentIssue = await getCurrentIssue();
      if (!currentIssue) {
        return {
          success: false,
          error: {
            type: 'UserError',
            message: 'No current issue found'
          }
        };
      }
      issueNumber = currentIssue.number;
    }
    
    try {
      // Get issue content
      const issueContent = await getIssue(issueNumber);
      
      // Check if Failed approaches section exists
      const sectionName = 'Failed approaches';
      const section = findSectionByName(issueContent, sectionName);
      
      if (!section) {
        return {
          success: false,
          error: {
            type: 'SectionNotFoundError',
            message: `Section "${sectionName}" not found in issue`
          }
        };
      }
      
      // Add the failed approach to the section
      const updatedContent = addContentToSection(
        issueContent,
        sectionName,
        args.approach,
        'failure',
        { reason: args.reason }
      );
      
      // Save the updated content
      await saveIssue(issueNumber, updatedContent);
      
      return {
        success: true,
        data: {
          issueNumber,
          approachLogged: true
        }
      };
    } catch (error) {
      // Handle issue not found
      return createNotFoundError('Issue', issueNumber);
    }
  }, 'logFailure')
);

/**
 * List available templates
 * 
 * @param {Object} args - Command arguments
 * @param {string} [args.type] - Template type (issue or tag)
 * @returns {Promise<Object>} MCP result object
 */
const mcp__listTemplates = withValidation('mcp__listTemplates',
  async (args) => {
    try {
      if (args.type) {
        // Get templates for the specified type
        const templates = await getTemplateList(args.type);
        
        return {
          success: true,
          data: {
            templates,
            type: args.type
          }
        };
      } else {
        // If no type specified, get both issue and tag templates
        const issueTemplates = await getTemplateList('issue');
        const tagTemplates = await getTemplateList('tag');
        
        return {
          success: true,
          data: {
            issue: issueTemplates,
            tag: tagTemplates
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'Error',
          message: `Failed to list templates: ${error.message}`
        }
      };
    }
  }
);

/**
 * Show a specific template
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.name - Template name
 * @param {string} args.type - Template type (issue or tag)
 * @returns {Promise<Object>} MCP result object
 */
const mcp__showTemplate = withValidation('mcp__showTemplate',
  async (args) => {
    // Check required parameters
    if (!args.name) {
      return createValidationError('Template name is required');
    }
    
    if (!args.type) {
      return createValidationError('Template type is required');
    }
    
    try {
      // Validate template exists
      const exists = await validateTemplate(args.name, args.type);
      
      if (!exists) {
        return createNotFoundError('Template', `${args.name} (${args.type})`);
      }
      
      // Load the template
      const content = await loadTemplate(args.name, args.type);
      
      return {
        success: true,
        data: {
          name: args.name,
          type: args.type,
          content
        }
      };
    } catch (error) {
      return createValidationError(`Failed to show template: ${error.message}`);
    }
  }
);

module.exports = {
  mcp__listIssues,
  mcp__showIssue,
  mcp__getCurrentTask,
  mcp__addTask,
  mcp__createIssue,
  mcp__completeTask,
  mcp__addNote,
  mcp__addQuestion,
  mcp__logFailure,
  mcp__listTemplates,
  mcp__showTemplate
};