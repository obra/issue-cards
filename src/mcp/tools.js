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
  isInitialized, 
  createDirectoryStructure 
} = require('../utils/directory');
const { 
  copyDefaultTemplates 
} = require('../utils/templateInit');
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
    
    // Add comprehensive workflow guidance to the response
    return {
      success: true,
      data: issues,
      workflowGuidance: {
        message: "IMPORTANT: After selecting an issue to work on, use mcp__getCurrentTask to get your current task rather than trying to implement all tasks at once.",
        recommendedWorkflow: "For proper task workflow: 1) Use mcp__getCurrentTask to get your current task, 2) Implement ONLY that specific task, 3) Use mcp__completeTask when done to mark it complete and receive the next task.",
        nextSteps: [
          "1️⃣ Choose an issue to work on from the list above",
          "2️⃣ Use mcp__setCurrentIssue with the issue number to set it as your current issue",
          "3️⃣ Use mcp__getCurrentTask to see the first task to implement"
        ],
        exampleCommands: [
          {
            "description": "Set an issue as current",
            "command": {
              "tool": "mcp__setCurrentIssue",
              "args": { "issueNumber": "[ISSUE_NUMBER]" }
            }
          },
          {
            "description": "View your current task",
            "command": {
              "tool": "mcp__getCurrentTask",
              "args": {}
            }
          }
        ],
        details: "Following the task sequence ensures each step is properly documented and tracked. Never skip ahead in the sequence, as tasks often build upon each other. For comprehensive command sequences, see the 'Ticket Creation Workflow' documentation."
      }
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
    
    // Extract tasks and find the current one
    const tasks = await extractTasks(issue.content);
    const currentTask = findCurrentTask(tasks);
    
    // Add comprehensive task processing guidance to the response
    const response = {
      ...issue,
      taskGuidance: "IMPORTANT: To implement tasks from this issue, use mcp__getCurrentTask to focus on ONE task at a time rather than trying to implement all tasks at once. Working on one task at a time ensures proper tracking and step-by-step progress.",
      workflowTip: "For proper task workflow: 1) Use mcp__getCurrentTask to get your current task, 2) Implement ONLY that specific task, 3) Use mcp__completeTask when done to mark the task complete and receive the next task.",
      workflowGuidance: {
        message: "⚠️ This command provides a reference view of the entire issue. For actual implementation work, follow the task-by-task approach below.",
        nextSteps: [
          "1️⃣ Set this issue as your current issue (if not already)",
          "2️⃣ Use mcp__getCurrentTask to see your specific assigned task",
          "3️⃣ Document your approach with mcp__addNote before implementation",
          "4️⃣ Mark task complete with mcp__completeTask when finished"
        ],
        exampleCommands: [
          {
            "description": "Set this issue as current",
            "command": {
              "tool": "mcp__setCurrentIssue",
              "args": { "issueNumber": issue.issueNumber }
            }
          },
          {
            "description": "Get your current task",
            "command": {
              "tool": "mcp__getCurrentTask",
              "args": {}
            }
          },
          {
            "description": "Document your approach",
            "command": {
              "tool": "mcp__addNote",
              "args": {
                "section": "Planned approach",
                "note": "[Your implementation approach here]"
              }
            }
          }
        ],
        details: "For a complete guide to working with tasks in issue-cards, see the 'Task Management Workflow' and 'Ticket Creation Workflow' documentation."
      }
    };
    
    // If there's a current task, include detailed information about it
    if (currentTask) {
      response.currentTaskInfo = {
        id: currentTask.id,
        description: currentTask.text,
        message: "Use mcp__getCurrentTask to focus on implementing this specific task.",
        implementationGuidance: "When implementing this task, follow these best practices:",
        bestPractices: [
          "✅ Document your implementation plan before coding",
          "✅ If you have questions, use mcp__addQuestion to document them",
          "✅ If you try an approach that doesn't work, use mcp__logFailure to document it",
          "✅ Mark the task complete with mcp__completeTask when finished"
        ]
      };
    }
    
    return {
      success: true,
      data: response
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
      issueNumber: currentIssue.issueNumber,
      issueTitle: currentIssue.title,
      taskId: currentTask ? currentTask.id : null,
      description: currentTask ? currentTask.description : null
    };
    
    // Include context data if available
    if (currentTask && currentTask.contextData) {
      response.context = currentTask.contextData;
    }
    
    // Add comprehensive implementation guidance for the current task
    if (currentTask) {
      const taskHasTDDTag = currentTask.description && 
                           (currentTask.description.includes('+unit-test') || 
                            currentTask.description.includes('+e2e-test') || 
                            currentTask.description.includes('+integration-test'));
      
      response.taskGuidance = "Important: Please focus ONLY on completing this specific task. Do not work on any other tasks or future tasks until this task is complete and marked as completed.";
      response.nextSteps = "Please review the task description and implement only this specific task. When complete, use mcp__completeTask to mark it finished and receive your next task.";
      
      // Comprehensive workflow guidance
      response.workflowGuidance = {
        message: "🎯 Focus on implementing ONLY this task, following best practices.",
        implementationSteps: [
          "1️⃣ Document your implementation plan with mcp__addNote",
          "2️⃣ Record questions or unclear requirements with mcp__addQuestion",
          "3️⃣ Document any failed approaches with mcp__logFailure",
          "4️⃣ Mark task complete with mcp__completeTask when finished"
        ],
        exampleCommands: [
          {
            "description": "Document implementation approach",
            "command": {
              "tool": "mcp__addNote",
              "args": {
                "section": "Planned approach",
                "note": "[Your implementation approach here]"
              }
            }
          },
          {
            "description": "Ask a clarifying question",
            "command": {
              "tool": "mcp__addQuestion",
              "args": {
                "question": "[Your question about requirements or implementation]"
              }
            }
          },
          {
            "description": "Record a failed approach",
            "command": {
              "tool": "mcp__logFailure",
              "args": {
                "approach": "[Approach that didn't work]",
                "reason": "[Why it didn't work]"
              }
            }
          },
          {
            "description": "Complete this task",
            "command": {
              "tool": "mcp__completeTask",
              "args": {}
            }
          }
        ]
      };
      
      // Add TDD-specific guidance if the task has a TDD tag
      if (taskHasTDDTag) {
        response.workflowGuidance.tddGuidance = {
          message: "This task requires Test-Driven Development (Red-Green-Refactor cycle):",
          tddSteps: [
            "🔴 RED: Write failing tests that define the expected behavior",
            "🟢 GREEN: Write the minimum code necessary to pass the tests",
            "🔄 REFACTOR: Improve the code while keeping tests passing"
          ],
          documentation: "For detailed TDD guidance, see the 'TDD Workflow' documentation."
        };
      }
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
    
    // Create enhanced response with workflow guidance
    return {
      success: true,
      data: {
        issueNumber: issueNumber,
        title: args.title,
        template: args.template,
        // Add detailed workflow guidance
        workflowGuidance: {
          message: "✅ Issue created successfully! Here's how to start working on it:",
          nextSteps: [
            "1️⃣ Set this issue as your current issue",
            "2️⃣ Use mcp__getCurrentTask to see your first task",
            "3️⃣ Follow the task-by-task workflow to implement the solution"
          ],
          exampleCommands: [
            {
              "description": "Set this issue as current",
              "command": {
                "tool": "mcp__setCurrentIssue",
                "args": { "issueNumber": issueNumber }
              }
            },
            {
              "description": "View your first task",
              "command": {
                "tool": "mcp__getCurrentTask",
                "args": {}
              }
            }
          ],
          details: "For a complete guide to working with issues and tasks, see the 'Ticket Creation Workflow' documentation."
        }
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
    await saveIssue(currentIssue.issueNumber, updatedContent);
    
    // Check if all tasks are now completed
    const updatedTasks = await extractTasks(updatedContent);
    const nextTask = findCurrentTask(updatedTasks);
    
    // Prepare response data
    const responseData = {
      taskCompleted: currentTask.text,
      issueNumber: currentIssue.issueNumber
    };
    
    if (!nextTask) {
      // All tasks are completed, close the issue
      await closeIssue(currentIssue.issueNumber);
      responseData.nextTask = null;
      responseData.issueCompleted = true;
    } else {
      // There's a next task, include it in the response with clear instructions
      responseData.nextTask = {
        id: nextTask.id,
        description: nextTask.text
      };
      
      // Add explicit, comprehensive guidance for the next task
      responseData.taskGuidance = "Important: Please focus ONLY on completing this specific task. Do not work on any other tasks or future tasks until this task is complete and marked as completed.";
      
      // Add an explicit next step instruction
      responseData.nextSteps = "Please review the task description and implement only this specific task. When complete, use mcp__completeTask to mark it finished and receive your next task.";
      
      // Add detailed workflow guidance for the next task
      responseData.workflowGuidance = {
        message: "✅ Great job completing the previous task! Now focus on the next task below.",
        progressUpdate: `Task ${responseData.nextTask.id} of the issue is now ready to implement.`,
        implementationSteps: [
          "1️⃣ Take time to understand this task before implementation",
          "2️⃣ Document your implementation plan with mcp__addNote",
          "3️⃣ Implement the solution, documenting decisions as you go",
          "4️⃣ Mark task complete with mcp__completeTask when finished"
        ],
        exampleCommands: [
          {
            "description": "Document implementation approach",
            "command": {
              "tool": "mcp__addNote",
              "args": {
                "section": "Planned approach",
                "note": "[Your implementation approach for this task]"
              }
            }
          },
          {
            "description": "Complete this task when finished",
            "command": {
              "tool": "mcp__completeTask",
              "args": {}
            }
          }
        ],
        details: "Each task is a discrete unit of work. Ensure this task is fully implemented and tested before marking it complete."
      };
      
      // Check if the next task requires TDD
      if (nextTask.text && (
          nextTask.text.includes('+unit-test') || 
          nextTask.text.includes('+e2e-test') || 
          nextTask.text.includes('+integration-test'))) {
        responseData.workflowGuidance.tddGuidance = {
          message: "This task requires Test-Driven Development (Red-Green-Refactor cycle):",
          tddSteps: [
            "🔴 RED: Write failing tests that define the expected behavior",
            "🟢 GREEN: Write the minimum code necessary to pass the tests",
            "🔄 REFACTOR: Improve the code while keeping tests passing"
          ],
          documentation: "For detailed TDD guidance, see the 'TDD Workflow' documentation."
        };
      }
      
      // Get the issue content to extract context
      const issueContent = await getIssue(currentIssue.issueNumber);
      
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
 * Add a plain text note to a specific section of an issue
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.note - The note text to add
 * @param {string} args.section - Section to add the note to
 * @param {string} [args.issueNumber] - Issue number (uses current if not specified)
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
      issueNumber = currentIssue.issueNumber;
    }
    
    try {
      // Get issue content
      const issueContent = await getIssue(issueNumber);
      
      // Get normalized section name
      const normalizedSection = normalizeSectionName(args.section);
      
      try {
        // Add note to the section as plain text (no format)
        const updatedContent = addContentToSection(
          issueContent, 
          normalizedSection, 
          args.note, 
          null, // No format - plain text only
          {}    // No additional options
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
      issueNumber = currentIssue.issueNumber;
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
      issueNumber = currentIssue.issueNumber;
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

// Create aliases for commonly used commands with proper validation
const mcp__complete = withValidation('mcp__complete', async (args) => {
  return await mcp__completeTask(args);
});

const mcp__add = withValidation('mcp__add', async (args) => {
  return await mcp__addTask(args);
});

const mcp__question = withValidation('mcp__question', async (args) => {
  return await mcp__addQuestion(args);
});

const mcp__failure = withValidation('mcp__failure', async (args) => {
  return await mcp__logFailure(args);
});

/**
 * Initialize issue tracking in the current project
 * 
 * @param {Object} args - Command arguments
 * @returns {Promise<Object>} MCP result object
 */
const mcp__init = withValidation('mcp__init',
  withErrorHandling(async (args) => {
    try {
      // Check if already initialized
      const initialized = await isInitialized();
      
      if (initialized) {
        return {
          success: true,
          data: {
            initialized: false,
            message: 'Issue tracking is already initialized in this project'
          }
        };
      }
      
      // Create directory structure
      await createDirectoryStructure();
      
      // Copy default templates
      await copyDefaultTemplates();
      
      return {
        success: true,
        data: {
          initialized: true,
          message: 'Successfully initialized issue tracking system. Ready to create your first issue.'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'InitError',
          message: `Failed to initialize issue tracking: ${error.message}`
        }
      };
    }
  }, 'init')
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
  mcp__showTemplate,
  mcp__init,
  // Aliases
  mcp__complete,
  mcp__add,
  mcp__question,
  mcp__failure
};