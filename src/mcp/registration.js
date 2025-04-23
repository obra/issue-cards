// ABOUTME: MCP tool registration and request handling
// ABOUTME: Manages tool metadata, validation and execution

// Import tool implementations
const mcpTools = require('./tools');
const onboardingTools = require('./onboardingTools');

// Merge all MCP tools into a single object
const allMcpTools = {
  ...mcpTools,
  ...onboardingTools
};

// Storage for registered tools
const registeredTools = [];

/**
 * Register all available MCP tools
 * 
 * @returns {Array<Object>} Array of registered tools with metadata
 */
function registerMcpTools() {
  // Clear existing registrations
  registeredTools.length = 0;
  
  // Map of tool descriptions
  const toolDescriptions = {
    mcp__listIssues: 'List all issues in the repository, with optional filtering by state',
    mcp__showIssue: 'Show details of a specific issue by number',
    mcp__getCurrentTask: 'Get the current task from the current issue',
    mcp__addTask: 'Add a new task to a specific issue',
    mcp__createIssue: 'Create a new issue from a template',
    mcp__completeTask: 'Mark the current task as completed and move to the next task',
    mcp__addNote: 'Add a note to the current issue',
    mcp__addQuestion: 'Add a question to the current issue',
    mcp__logFailure: 'Log a failed approach in the current issue',
    mcp__listTemplates: 'List available issue templates',
    mcp__showTemplate: 'Show the contents of a specific template',
    mcp__complete: 'Alias for completeTask - marks the current task as completed',
    mcp__add: 'Alias for addTask - adds a new task to an issue',
    mcp__question: 'Alias for addQuestion - adds a question to the current issue',
    mcp__failure: 'Alias for logFailure - logs a failed approach',
    mcp__onboarding: 'Provides onboarding information for new users',
    mcp__workflow: 'Provides information about the recommended workflow',
    mcp__pm: 'Provides information for project managers',
    mcp__dev: 'Provides information for developers',
    mcp__reviewer: 'Provides information for code reviewers'
  };
  
  // Map of tool parameters
  const toolParameters = {
    mcp__listIssues: [
      {
        name: 'state',
        type: 'string',
        description: 'Filter by issue state (open, closed, all)',
        required: false
      }
    ],
    mcp__showIssue: [
      {
        name: 'issueNumber',
        type: 'string',
        description: 'The issue number to show',
        required: true
      }
    ],
    mcp__getCurrentTask: [],
    mcp__addTask: [
      {
        name: 'issueNumber',
        type: 'string',
        description: 'The issue number to add the task to',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        description: 'The task description',
        required: true
      }
    ],
    mcp__createIssue: [
      {
        name: 'title',
        type: 'string',
        description: 'The title of the issue',
        required: true
      },
      {
        name: 'template',
        type: 'string',
        description: 'The template to use (default: feature)',
        required: false
      },
      {
        name: 'problem',
        type: 'string',
        description: 'Description of the problem to be solved',
        required: true
      },
      {
        name: 'approach',
        type: 'string',
        description: 'Planned approach to solve the problem',
        required: true
      }
    ],
    mcp__completeTask: [],
    mcp__addNote: [
      {
        name: 'note',
        type: 'string',
        description: 'The note to add',
        required: true
      },
      {
        name: 'section',
        type: 'string',
        description: 'The section to add the note to',
        required: true
      },
      {
        name: 'issueNumber',
        type: 'string',
        description: 'The issue number (defaults to current)',
        required: false
      }
    ],
    mcp__addQuestion: [
      {
        name: 'question',
        type: 'string',
        description: 'The question to add',
        required: true
      },
      {
        name: 'issueNumber',
        type: 'string',
        description: 'The issue number (defaults to current)',
        required: false
      }
    ],
    mcp__logFailure: [
      {
        name: 'approach',
        type: 'string',
        description: 'Description of the failed approach',
        required: true
      },
      {
        name: 'reason',
        type: 'string',
        description: 'Reason why the approach failed',
        required: true
      },
      {
        name: 'issueNumber',
        type: 'string',
        description: 'The issue number (defaults to current)',
        required: false
      }
    ],
    mcp__listTemplates: [
      {
        name: 'type',
        type: 'string',
        description: 'Template type (issue or tag)',
        required: false
      }
    ],
    mcp__showTemplate: [
      {
        name: 'name',
        type: 'string',
        description: 'The template name to show',
        required: true
      },
      {
        name: 'type',
        type: 'string',
        description: 'Template type (issue or tag)',
        required: true
      }
    ]
  };
  
  // Aliases share parameters with their main commands
  toolParameters.mcp__complete = toolParameters.mcp__completeTask;
  toolParameters.mcp__add = toolParameters.mcp__addTask;
  toolParameters.mcp__question = toolParameters.mcp__addQuestion;
  toolParameters.mcp__failure = toolParameters.mcp__logFailure;
  
  // Onboarding tools
  toolParameters.mcp__onboarding = [
    {
      name: 'role',
      type: 'string',
      description: 'Role-specific onboarding (pm, developer, reviewer)',
      required: false
    }
  ];
  
  toolParameters.mcp__workflow = [
    {
      name: 'workflow',
      type: 'string',
      description: 'The workflow to get guidance for',
      required: false
    }
  ];
  
  toolParameters.mcp__pm = [];
  toolParameters.mcp__dev = [];
  toolParameters.mcp__reviewer = [];
  
  // Extract and register each MCP tool
  Object.entries(allMcpTools).forEach(([name, implementation]) => {
    // Only register functions that follow the mcp__ naming convention
    if (typeof implementation === 'function' && name.startsWith('mcp__')) {
      // Try to extract metadata from JSDocs first
      const metadata = extractToolMetadata(implementation, name);
      
      // Add to registry with guaranteed metadata
      registeredTools.push({
        name,
        implementation,
        description: metadata.description || toolDescriptions[name] || 'No description available',
        parameters: metadata.parameters.length > 0 ? metadata.parameters : (toolParameters[name] || [])
      });
    }
  });
  
  return registeredTools;
}

/**
 * Extract tool metadata from function
 * 
 * @param {Function} func - The function to extract metadata from
 * @param {string} toolName - The name of the tool
 * @returns {Object} Tool metadata
 */
function extractToolMetadata(func, toolName) {
  // Default metadata
  const metadata = {
    description: '',
    parameters: []
  };
  
  // Try to get documentation from function toString
  const funcString = func.toString();
  
  // Improved pattern to extract the JSDoc comment block above the function
  const jsDocPattern = /\/\*\*\s*([\s\S]*?)\s*\*\/\s*(?:const\s+\w+\s*=\s*.*|function)/;
  const jsDocMatch = jsDocPattern.exec(funcString);
  
  if (jsDocMatch && jsDocMatch[1]) {
    const jsDoc = jsDocMatch[1];
    
    // Extract description - everything until first @
    const descriptionPattern = /\*\s*([\s\S]*?)(?=\*\s*@|\*\/)/;
    const descMatch = descriptionPattern.exec(jsDoc);
    if (descMatch && descMatch[1]) {
      metadata.description = descMatch[1]
        .replace(/\n\s*\*/g, ' ')  // Remove line breaks and asterisks
        .trim();
    }
    
    // Extract parameters with improved regex that handles multiline descriptions
    const paramMatches = jsDoc.matchAll(/@param\s*{([^}]*)}\s*(\[[^\]]*\]|\S+)\s*-\s*([\s\S]*?)(?=\s*\*\s*@|\s*\*\/)/g);
    
    for (const match of paramMatches) {
      let [, type, name, description] = match;
      
      // Clean up description by removing * and excess whitespace
      description = description.replace(/\n\s*\*/g, ' ').trim();
      
      // Skip args parent object
      if (name === 'args') continue;
      
      // Handle args.param notation
      if (name.startsWith('args.')) {
        name = name.replace('args.', '');
        
        // Handle optional parameters indicated by []
        const isOptional = name.startsWith('[') && name.includes(']');
        if (isOptional) {
          name = name.replace(/^\[|\]$/g, ''); // Remove [] brackets
        }
        
        // Add parameters with properties determined from comments
        metadata.parameters.push({
          name,
          type: type.toLowerCase(),
          description: description.trim(),
          required: !isOptional && description.toLowerCase().includes('required')
        });
      } else {
        // Handle direct param notation without args. prefix
        // This handles parameters like @param {Object} args - Command arguments
        if (name !== 'args') {
          const isOptional = name.startsWith('[') && name.includes(']');
          if (isOptional) {
            name = name.replace(/^\[|\]$/g, ''); // Remove [] brackets
          }
          
          metadata.parameters.push({
            name,
            type: type.toLowerCase(),
            description: description.trim(),
            required: !isOptional && description.toLowerCase().includes('required')
          });
        }
      }
    }
  }
  
  return metadata;
}

/**
 * Get list of registered tools
 * 
 * @returns {Array<Object>} Array of registered tools
 */
function getRegisteredTools() {
  // Initialize tools if empty
  if (registeredTools.length === 0) {
    registerMcpTools();
  }
  
  // Return copy without implementation functions
  return registeredTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

/**
 * Validate incoming tool execution requests
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware function
 */
function validateToolRequest(req, res, next) {
  const { body } = req;
  
  // Validate tool name
  if (!body.tool) {
    return res.status(400).json({
      error: 'Missing required parameter: tool'
    });
  }
  
  // Validate arguments
  if (!body.args || typeof body.args !== 'object') {
    return res.status(400).json({
      error: 'Missing or invalid parameter: args (must be an object)'
    });
  }
  
  // Initialize tools if needed
  if (registeredTools.length === 0) {
    registerMcpTools();
  }
  
  // Find the requested tool
  const tool = registeredTools.find(t => t.name === body.tool);
  
  // Validate that the tool exists
  if (!tool) {
    return res.status(404).json({
      error: 'Tool not found',
      message: `No tool found with name: ${body.tool}`
    });
  }
  
  // Validate required parameters
  const missingParams = tool.parameters
    .filter(param => param.required && !body.args.hasOwnProperty(param.name))
    .map(param => param.name);
  
  if (missingParams.length > 0) {
    return res.status(400).json({
      error: 'Missing required parameters',
      parameters: missingParams
    });
  }
  
  // Add the resolved tool to request for later use
  req.resolvedTool = tool;
  
  // All validations passed
  next();
}

/**
 * Execute the requested tool
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function executeToolRequest(req, res) {
  try {
    const { tool, args } = req.body;
    const resolvedTool = req.resolvedTool || 
      registeredTools.find(t => t.name === tool);
    
    if (!resolvedTool) {
      return res.status(404).json({
        error: 'Tool not found',
        message: `No tool found with name: ${tool}`
      });
    }
    
    // Execute the tool
    const result = await resolvedTool.implementation(args);
    
    // Return the result
    res.status(200).json(result);
  } catch (error) {
    // Handle unexpected errors
    console.error(`Error executing tool:`, error);
    res.status(500).json({
      error: 'Tool execution failed',
      message: error.message
    });
  }
}

module.exports = {
  registerMcpTools,
  getRegisteredTools,
  validateToolRequest,
  executeToolRequest,
  
  // Expose for testing
  __test__: {
    extractToolMetadata
  }
};