// ABOUTME: MCP onboarding tools for AI integration workflows
// ABOUTME: Provides guidance for AIs on using issue-cards effectively

const { withValidation } = require('./validator');
const { withErrorHandling, createValidationError } = require('./errorHandler');
const { loadRoleDoc } = require('../utils/documentationParser');
const { isInitialized } = require('../utils/directory');
const { loadTemplate, getTemplateList } = require('../utils/template');

/**
 * Get available tag templates with their descriptions
 * 
 * @returns {Promise<Array<{name: string, description: string}>>} Array of tag templates with descriptions
 */
async function getTagTemplatesWithDescriptions() {
  try {
    // Get list of available tag templates
    const tagNames = await getTemplateList('tag');
    
    // Load each template and extract its description
    const templatesWithDescriptions = await Promise.all(tagNames.map(async (name) => {
      try {
        const content = await loadTemplate(name, 'tag');
        
        // Extract description from the content (after the title and before the steps section)
        const descriptionMatch = content.match(/^#\s+.*?\n\n>\s+(.*?)\n\n##\s+Steps/s);
        const description = descriptionMatch ? descriptionMatch[1].trim() : 'No description available';
        
        return {
          name,
          description
        };
      } catch (error) {
        // Return template name without description if loading fails
        return {
          name,
          description: 'Description unavailable'
        };
      }
    }));
    
    return templatesWithDescriptions;
  } catch (error) {
    console.error('Error getting tag templates:', error);
    return [];
  }
}

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
    
    try {
      // Load role documentation from the documentation files
      const roleDoc = loadRoleDoc(role);
      
      // Process workflows into the expected format
      let workflows = [];
      if (roleDoc.workflows) {
        // Extract workflow names and convert to the expected format
        workflows = roleDoc.workflows.map(workflowText => {
          // Parse out workflow name from markdown link format [Name](path)
          const nameMatch = workflowText.match(/\[(.*?)\]/);
          const name = nameMatch ? nameMatch[1] : workflowText;
          
          return {
            name,
            // We don't include steps here since we'd need to load each workflow doc
            // Steps will be available through the mcp__workflow tool
          };
        });
      }
      
      // Get available tag templates with descriptions
      const tagTemplates = await getTagTemplatesWithDescriptions();
      
      // Format the enhanced response with comprehensive guidance
      const responseData = {
        title: roleDoc.title,
        description: roleDoc.description,
        workflows: workflows,
        bestPractices: roleDoc.bestPractices,
        toolExamples: roleDoc.toolExamples || [],
        tagTemplates: tagTemplates, // Add the tag templates to the response
        
        // Add role-specific guidance
        roleGuidance: {
          message: `Welcome to issue-cards ${role} role! Here's how to get started:`,
          startingSteps: role === 'pm' ? [
            "1️⃣ Create a new issue with mcp__createIssue or view existing issues with mcp__listIssues",
            "2️⃣ Structure tasks in a logical sequence with clear requirements",
            "3️⃣ Use tag templates to add standardized workflows to tasks",
            "4️⃣ Monitor progress with mcp__showIssue"
          ] : role === 'developer' ? [
            "1️⃣ View your assigned issues with mcp__listIssues",
            "2️⃣ Set your current issue with mcp__setCurrentIssue",
            "3️⃣ Get your current task with mcp__getCurrentTask",
            "4️⃣ Follow the TDD workflow for test-related tasks"
          ] : [
            "1️⃣ View issues to be reviewed with mcp__listIssues",
            "2️⃣ Examine issue details with mcp__showIssue",
            "3️⃣ Review task implementation and provide feedback", 
            "4️⃣ Verify all tasks are appropriately completed"
          ],
          recommendedCommands: role === 'pm' ? [
            {
              "description": "Create a new feature issue",
              "command": {
                "tool": "mcp__createIssue",
                "args": {
                  "template": "feature",
                  "title": "[Feature title]",
                  "problem": "[Problem description]",
                  "task": ["[First task]", "[Second task]"]
                }
              }
            },
            {
              "description": "List all issues",
              "command": {
                "tool": "mcp__listIssues",
                "args": { "state": "open" }
              }
            }
          ] : role === 'developer' ? [
            {
              "description": "Get your current task",
              "command": {
                "tool": "mcp__getCurrentTask",
                "args": {}
              }
            },
            {
              "description": "Complete current task",
              "command": {
                "tool": "mcp__completeTask",
                "args": {}
              }
            }
          ] : [
            {
              "description": "Show issue details",
              "command": {
                "tool": "mcp__showIssue",
                "args": { "issueNumber": "[ISSUE_NUMBER]" }
              }
            }
          ]
        }
      };
      
      // Add TDD-specific guidance for developers
      if (role === 'developer') {
        responseData.tddGuidance = {
          message: "For Test-Driven Development tasks, follow this workflow:",
          tddCycle: [
            "🔴 RED: Write failing tests that define the expected behavior",
            "🟢 GREEN: Write the minimum code necessary to pass the tests",
            "🔄 REFACTOR: Improve the code while keeping tests passing"
          ],
          tagUsage: "Look for tasks with +unit-test, +integration-test, or +e2e-test tags for TDD workflows.",
          documentation: "For comprehensive TDD guidance, see the 'TDD Workflow' and 'TDD Task Sequences' documentation."
        };
      }
      
      // Check if repository is initialized
      let initialized = undefined;
      try {
        initialized = await isInitialized();
        responseData.isInitialized = initialized;
        
        // If not initialized, add a message suggesting initialization
        if (!initialized) {
          responseData.initMessage = "This repository is not initialized for issue-cards. Run mcp__init first to initialize issue tracking before using other tools.";
        }
      } catch (initError) {
        // If we can't check initialization status for some reason, add a warning
        responseData.initMessage = "Unable to check if repository is initialized. You may need to run mcp__init before using other issue-cards tools.";
      }
      
      // Return standard response - stdioTransport will add content field
      return {
        success: true,
        data: responseData
      };
    } catch (error) {
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
    const { loadWorkflowDoc, listWorkflows } = require('../utils/documentationParser');
    
    // If no specific workflow requested, return list of available workflows
    if (!args.workflow) {
      const availableWorkflows = listWorkflows();
      
      const responseData = {
        title: "Available Workflows",
        workflows: availableWorkflows
      };
      
      return {
        success: true,
        data: responseData
      };
    }
    
    try {
      // Load the requested workflow from documentation
      const workflowDoc = loadWorkflowDoc(args.workflow);
      
      // Convert steps to the expected format
      const formattedSteps = [];
      if (workflowDoc.steps) {
        // Try to parse step details from the text
        workflowDoc.steps.forEach((step, index) => {
          let stepDetails = {
            step: index + 1,
            description: step
          };
          
          // Try to extract tool name and args from the step text if available
          const toolMatch = step.match(/using `(mcp__[a-zA-Z0-9_]+)`/);
          if (toolMatch) {
            stepDetails.tool = toolMatch[1];
          }
          
          formattedSteps.push(stepDetails);
        });
      }
      
      // Check if this is a TDD-related workflow
      const isTDDWorkflow = args.workflow === 'tdd-workflow' || 
                            workflowDoc.title.toLowerCase().includes('tdd') || 
                            workflowDoc.title.toLowerCase().includes('test-driven');
      
      // Basic response data
      const responseData = {
        title: workflowDoc.title,
        description: workflowDoc.description,
        steps: formattedSteps,
        exampleToolSequence: workflowDoc.exampleToolSequence,
        tips: workflowDoc.tips
      };
      
      // Add enhanced workflow guidance
      responseData.workflowGuidance = {
        message: `Follow this workflow to implement ${workflowDoc.title.toLowerCase()} effectively:`,
        bestPractices: [
          "✅ Follow steps in the sequence provided for best results",
          "✅ Document your approach before implementation",
          "✅ Use provided example commands as templates",
          "✅ Reference related documentation for detailed guidance"
        ],
        relatedWorkflows: args.workflow === 'create-feature' ? 
          ['task-management', 'tdd-workflow'] : 
          args.workflow === 'bugfix' ?
            ['task-management', 'tdd-workflow'] :
            args.workflow === 'tdd-workflow' ?
              ['create-feature', 'task-management'] :
              ['create-feature', 'task-management']
      };
      
      // Add TDD-specific guidance for TDD workflows or testing-related workflows
      if (isTDDWorkflow) {
        responseData.workflowGuidance.tddSpecificGuidance = {
          message: "This workflow follows Test-Driven Development principles:",
          tddCycle: [
            "🔴 RED: Write failing tests that define the expected behavior",
            "🟢 GREEN: Write the minimum code necessary to pass the tests",
            "🔄 REFACTOR: Improve the code while keeping tests passing"
          ],
          tagUsage: "Use +unit-test, +integration-test, or +e2e-test tags to automatically add TDD steps to tasks.",
          documentation: "For comprehensive guidance on implementing TDD, see the 'TDD Task Sequences' documentation."
        };
      }
      
      return {
        success: true,
        data: responseData
      };
    } catch (error) {
      return createValidationError(`Unknown workflow: ${args.workflow}`);
    }
  }, 'workflow')
);

/**
 * Project manager onboarding (alias for mcp__onboarding with role=pm)
 * 
 * @param {Object} args - Command arguments (ignored)
 * @returns {Promise<Object>} MCP result object with PM onboarding information
 */
const mcp__pm = withValidation('mcp__pm',
  withErrorHandling(async (args) => {
    // Always use PM role for this alias
    return await mcp__onboarding({ role: 'pm' });
  }, 'pmOnboarding')
);

/**
 * Developer onboarding (alias for mcp__onboarding with role=developer)
 * 
 * @param {Object} args - Command arguments (ignored)
 * @returns {Promise<Object>} MCP result object with developer onboarding information
 */
const mcp__dev = withValidation('mcp__dev',
  withErrorHandling(async (args) => {
    // Always use developer role for this alias
    return await mcp__onboarding({ role: 'developer' });
  }, 'devOnboarding')
);

/**
 * Reviewer onboarding (alias for mcp__onboarding with role=reviewer)
 * 
 * @param {Object} args - Command arguments (ignored)
 * @returns {Promise<Object>} MCP result object with reviewer onboarding information
 */
const mcp__reviewer = withValidation('mcp__reviewer',
  withErrorHandling(async (args) => {
    // Always use reviewer role for this alias
    return await mcp__onboarding({ role: 'reviewer' });
  }, 'reviewerOnboarding')
);

/**
 * Get available tag templates with descriptions
 * 
 * @param {Object} args - Command arguments (unused, kept for consistency)
 * @returns {Promise<Object>} MCP result object with tag templates and descriptions
 */
const mcp__availableTags = withValidation('mcp__availableTags',
  withErrorHandling(async (args) => {
    try {
      const tagTemplates = await getTagTemplatesWithDescriptions();
      
      // Categorize templates by type for better organization
      const categorizedTemplates = {
        testingTemplates: tagTemplates.filter(t => 
          t.name.includes('test') || t.description.includes('test')),
        documentationTemplates: tagTemplates.filter(t => 
          t.name.includes('doc') || t.description.includes('documentation')),
        qualityTemplates: tagTemplates.filter(t => 
          t.name.includes('lint') || t.description.includes('quality')),
        otherTemplates: tagTemplates.filter(t => 
          !t.name.includes('test') && 
          !t.description.includes('test') && 
          !t.name.includes('doc') && 
          !t.description.includes('documentation') &&
          !t.name.includes('lint') && 
          !t.description.includes('quality'))
      };
      
      return {
        success: true,
        data: {
          title: "Available Tag Templates",
          description: "These tag templates can be used to add standardized workflows to tasks using the '+tag-name' syntax at the end of a task.",
          tagTemplates: tagTemplates,
          categorizedTemplates: categorizedTemplates,
          usage: {
            example: "Add authentication to login page +unit-test",
            description: "Adding +unit-test to a task will automatically expand it to include Test-Driven Development steps"
          },
          workflowGuidance: {
            message: "Tag templates provide structured workflows for common development tasks:",
            bestPractices: [
              "✅ Use +unit-test for component or function-level testing",
              "✅ Use +integration-test for testing component interactions",
              "✅ Use +e2e-test for testing full user flows",
              "✅ Use +update-docs for documentation tasks",
              "✅ Use +lint-and-commit for code quality checks"
            ],
            examples: [
              "Implement user authentication +unit-test",
              "Create payment service integration +integration-test",
              "Add user registration flow +e2e-test",
              "Document API endpoints +update-docs"
            ],
            tddWorkflow: {
              description: "For Test-Driven Development workflows, use the testing tags (+unit-test, +integration-test, +e2e-test).",
              steps: [
                "1️⃣ RED: Write failing tests that define the expected behavior",
                "2️⃣ GREEN: Write the minimum code necessary to pass the tests",
                "3️⃣ REFACTOR: Improve the code while keeping tests passing"
              ],
              documentation: "For detailed TDD guidance, see the 'TDD Workflow' and 'TDD Task Sequences' documentation."
            }
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'Error',
          message: `Failed to retrieve tag templates: ${error.message}`
        }
      };
    }
  }, 'availableTags')
);

module.exports = {
  mcp__onboarding,
  mcp__workflow,
  mcp__pm,
  mcp__dev,
  mcp__reviewer,
  mcp__availableTags,
  // For testing
  getTagTemplatesWithDescriptions
};