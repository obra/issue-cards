// ABOUTME: MCP onboarding tools for AI integration workflows
// ABOUTME: Provides guidance for AIs on using issue-cards effectively

const { withValidation } = require('./validator');
const { withErrorHandling, createValidationError } = require('./errorHandler');

/**
 * Get onboarding information for project management workflows
 * 
 * @param {Object} args - Command arguments
 * @param {string} [args.role] - Role-specific onboarding (pm, developer, reviewer)
 * @returns {Promise<Object>} MCP result object with onboarding information
 */
const mcp__onboarding = withValidation('mcp__onboarding',
  withErrorHandling(async (args) => {
    // Default to project manager if no role specified
    const role = args.role || 'pm';
    
    // Define role-specific onboarding information
    const onboardingInfo = {
      // Project Manager onboarding
      pm: {
        title: "Project Manager Onboarding",
        description: "Welcome to issue-cards project management! Here's how to get started:",
        workflows: [
          {
            name: "Create a new feature issue",
            steps: [
              "1. List available templates with mcp__listTemplates",
              "2. Create a new issue with mcp__createIssue using the 'feature' template",
              "3. Add well-defined tasks to the issue using mcp__addTask"
            ],
            example: {
              tool: "mcp__createIssue",
              args: {
                template: "feature",
                title: "Implement user authentication",
                problem: "Users need to securely log in to the application",
                approach: "Use JWT-based authentication with secure password hashing",
                task: [
                  "Research authentication libraries",
                  "Design user schema",
                  "Implement login endpoint",
                  "Add token validation middleware",
                  "Create login form UI"
                ]
              }
            }
          },
          {
            name: "Track project progress",
            steps: [
              "1. List all issues with mcp__listIssues",
              "2. View specific issue details with mcp__showIssue",
              "3. Check current task status with mcp__getCurrentTask"
            ]
          },
          {
            name: "Documentation workflow",
            steps: [
              "1. Create a documentation issue with 'feature' template",
              "2. Break down documentation into specific tasks",
              "3. Add detailed instructions in the Instructions section"
            ]
          }
        ],
        bestPractices: [
          "Be specific about problem statements",
          "Break tasks into small, manageable chunks (1-2 hours of work)",
          "Include clear success criteria in task descriptions",
          "Add relevant context to help developers understand the purpose",
          "Use the Questions section to identify unknowns early"
        ],
        toolMap: [
          { name: "mcp__listIssues", description: "View all issues in the system" },
          { name: "mcp__showIssue", description: "View details of a specific issue" },
          { name: "mcp__createIssue", description: "Create a new issue from a template" },
          { name: "mcp__addTask", description: "Add a task to an existing issue" },
          { name: "mcp__addNote", description: "Add notes to issue sections" }
        ]
      },
      
      // Developer onboarding
      developer: {
        title: "Developer Onboarding",
        description: "Welcome to issue-cards developer workflow! Here's how to get started:",
        workflows: [
          {
            name: "Task workflow",
            steps: [
              "1. Get your current task with mcp__getCurrentTask",
              "2. Add questions using mcp__addQuestion if anything is unclear",
              "3. Log failed approaches with mcp__logFailure when you try something that doesn't work",
              "4. Complete task with mcp__completeTask when finished"
            ]
          },
          {
            name: "Contributing to issue planning",
            steps: [
              "1. Add suggestions to the Planned approach section with mcp__addNote",
              "2. Suggest additional tasks with mcp__addTask",
              "3. Add questions about implementation with mcp__addQuestion"
            ]
          }
        ],
        bestPractices: [
          "Document failed approaches to help others learn",
          "Break down complex tasks into smaller sub-tasks",
          "Add context notes about implementation decisions",
          "Complete tasks one at a time in sequence"
        ],
        toolMap: [
          { name: "mcp__getCurrentTask", description: "View your current task and context" },
          { name: "mcp__completeTask", description: "Mark your current task complete" },
          { name: "mcp__addQuestion", description: "Add questions to the issue" },
          { name: "mcp__logFailure", description: "Document approaches that didn't work" },
          { name: "mcp__addNote", description: "Add notes to any section" }
        ]
      },
      
      // Reviewer onboarding
      reviewer: {
        title: "Reviewer Onboarding",
        description: "Welcome to issue-cards review workflow! Here's how to get started:",
        workflows: [
          {
            name: "Review workflow",
            steps: [
              "1. List issues with mcp__listIssues to find completed issues",
              "2. Review issue details with mcp__showIssue",
              "3. Add feedback with mcp__addNote",
              "4. Add follow-up tasks with mcp__addTask if needed"
            ]
          }
        ],
        bestPractices: [
          "Check that all tasks are completed",
          "Verify that questions have been resolved",
          "Look for adequate documentation of approaches",
          "Ensure the solution matches the original problem statement"
        ],
        toolMap: [
          { name: "mcp__listIssues", description: "View all issues in the system" },
          { name: "mcp__showIssue", description: "View details of a specific issue" },
          { name: "mcp__addNote", description: "Add review feedback to sections" },
          { name: "mcp__addTask", description: "Add follow-up tasks if needed" }
        ]
      }
    };
    
    // Return role-specific onboarding or error if role not found
    if (onboardingInfo[role]) {
      return {
        success: true,
        data: onboardingInfo[role]
      };
    } else {
      return createValidationError(`Unknown role: ${role}. Available roles: pm, developer, reviewer`);
    }
  }, 'onboarding')
);

/**
 * Get workflow guide for common issue-cards processes
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.workflow - The workflow to get guidance for
 * @returns {Promise<Object>} MCP result object with workflow guide
 */
const mcp__workflow = withValidation('mcp__workflow',
  withErrorHandling(async (args) => {
    const workflows = {
      "create-feature": {
        title: "Create Feature Issue Workflow",
        description: "Guide for creating a well-structured feature issue",
        steps: [
          {
            step: 1,
            description: "Check available templates",
            tool: "mcp__listTemplates",
            args: { type: "issue" }
          },
          {
            step: 2,
            description: "Create new feature issue",
            tool: "mcp__createIssue",
            args: {
              template: "feature",
              title: "[Feature name]",
              problem: "[Clear description of the problem the feature solves]",
              approach: "[Planned implementation approach]",
              task: [
                "[Task 1 - Research phase]",
                "[Task 2 - Design phase]",
                "[Task 3 - Implementation phase]",
                "[Task 4 - Testing phase]"
              ]
            }
          },
          {
            step: 3,
            description: "Verify issue was created successfully",
            tool: "mcp__listIssues",
            args: { state: "open" }
          }
        ],
        tips: [
          "Feature titles should be clear and action-oriented",
          "Problems should focus on user/business needs, not implementation",
          "Tasks should be ordered by dependency and complexity",
          "Include research tasks before implementation tasks"
        ]
      },
      "bugfix": {
        title: "Bugfix Workflow",
        description: "Guide for creating and working on bug fixes",
        steps: [
          {
            step: 1,
            description: "Create bug issue",
            tool: "mcp__createIssue",
            args: {
              template: "bugfix",
              title: "[Concise bug description]",
              problem: "[Detailed bug description with steps to reproduce]",
              task: [
                "Reproduce the bug",
                "Identify root cause",
                "Implement fix",
                "Write tests to prevent regression"
              ]
            }
          },
          {
            step: 2,
            description: "Work through bugfix tasks",
            tool: "mcp__getCurrentTask",
            args: {}
          },
          {
            step: 3,
            description: "Document failed approaches",
            tool: "mcp__logFailure",
            args: {
              approach: "[Approach that didn't work]",
              reason: "[Why it didn't work]"
            }
          },
          {
            step: 4,
            description: "Complete tasks as they're finished",
            tool: "mcp__completeTask",
            args: {}
          }
        ],
        tips: [
          "Always include reproduction steps in bug descriptions",
          "Note environment details where the bug occurs",
          "Document failed approaches to prevent others from trying the same thing",
          "Add tests that would have caught the bug"
        ]
      },
      "task-management": {
        title: "Task Management Workflow",
        description: "Guide for efficient task management",
        steps: [
          {
            step: 1,
            description: "Check current task",
            tool: "mcp__getCurrentTask",
            args: {}
          },
          {
            step: 2,
            description: "Add clarifying questions if needed",
            tool: "mcp__addQuestion",
            args: {
              question: "[Your question about the task]"
            }
          },
          {
            step: 3,
            description: "Add implementation notes",
            tool: "mcp__addNote",
            args: {
              section: "Planned approach",
              note: "[Details about your implementation approach]"
            }
          },
          {
            step: 4,
            description: "Complete task when finished",
            tool: "mcp__completeTask",
            args: {}
          }
        ],
        tips: [
          "Focus on one task at a time",
          "Document your approach before implementing",
          "Ask questions early rather than making assumptions",
          "Check the 'Problem to be solved' section for context"
        ]
      }
    };
    
    // Return the requested workflow or list available workflows
    if (args.workflow && workflows[args.workflow]) {
      return {
        success: true,
        data: workflows[args.workflow]
      };
    } else {
      return {
        success: true,
        data: {
          title: "Available Workflows",
          workflows: Object.keys(workflows).map(key => ({
            id: key,
            title: workflows[key].title,
            description: workflows[key].description
          }))
        }
      };
    }
  }, 'workflow')
);

// Project manager alias for onboarding
const mcp__pm = withValidation('mcp__pm', async (args) => {
  // Always use PM role for this alias
  return await mcp__onboarding({ role: 'pm' });
});

// Developer alias for onboarding
const mcp__dev = withValidation('mcp__dev', async (args) => {
  // Always use developer role for this alias
  return await mcp__onboarding({ role: 'developer' });
});

// Reviewer alias for onboarding
const mcp__reviewer = withValidation('mcp__reviewer', async (args) => {
  // Always use reviewer role for this alias
  return await mcp__onboarding({ role: 'reviewer' });
});

module.exports = {
  mcp__onboarding,
  mcp__workflow,
  mcp__pm,
  mcp__dev,
  mcp__reviewer
};