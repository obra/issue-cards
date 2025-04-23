// ABOUTME: MCP onboarding tools for AI integration workflows
// ABOUTME: Provides guidance for AIs on using issue-cards effectively

const { withValidation } = require('./validator');
const { withErrorHandling, createValidationError } = require('./errorHandler');
const { loadRoleDoc } = require('../utils/documentationParser');
const { isInitialized } = require('../utils/directory');

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
      
      // Format the basic response
      const responseData = {
        title: roleDoc.title,
        description: roleDoc.description,
        workflows: workflows,
        bestPractices: roleDoc.bestPractices,
        toolExamples: roleDoc.toolExamples || []
      };
      
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
      
      const responseData = {
        title: workflowDoc.title,
        description: workflowDoc.description,
        steps: formattedSteps,
        exampleToolSequence: workflowDoc.exampleToolSequence,
        tips: workflowDoc.tips
      };
      
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

module.exports = {
  mcp__onboarding,
  mcp__workflow,
  mcp__pm,
  mcp__dev,
  mcp__reviewer
};