// ABOUTME: Utility for parsing AI documentation files
// ABOUTME: Extracts structured content from markdown for onboarding tools

const fs = require('fs');
const path = require('path');

// Cache for parsed documentation to avoid repeated file reads
const docsCache = new Map();

/**
 * Documentation index mapping roles, workflows, etc. to specific files
 * Serves as a lookup table for quickly finding the right documentation file
 */
const DOCUMENTATION_INDEX = {
  roles: {
    'pm': 'project-manager.md',
    'project-manager': 'project-manager.md',
    'developer': 'developer.md',
    'dev': 'developer.md',
    'reviewer': 'reviewer.md'
  },
  workflows: {
    'create-feature': 'create-feature.md',
    'bugfix': 'bugfix.md',
    'task-management': 'task-management.md',
    'review': 'review.md',
    'audit': 'audit.md'
  },
  'best-practices': {
    'task-organization': 'task-organization.md',
    'documentation': 'documentation.md'
  },
  'tool-examples': {
    'basic': 'basic-usage.md',
    'advanced': 'advanced-usage.md'
  }
};

/**
 * Get the absolute path to the AI documentation root directory
 * 
 * @returns {string} Absolute path to the AI documentation directory
 */
function getAiDocsPath() {
  return path.resolve(__dirname, '../../docs/ai');
}

/**
 * Load the content of a markdown file from the AI documentation
 * 
 * @param {string} category - Documentation category (roles, workflows, etc.)
 * @param {string} name - File name or identifier
 * @returns {string} Raw content of the markdown file
 * @throws {Error} If the file doesn't exist or can't be read
 */
function loadMarkdownFile(category, name) {
  // Resolve the file name from the index if it's an identifier
  let fileName = name;
  if (DOCUMENTATION_INDEX[category] && DOCUMENTATION_INDEX[category][name]) {
    fileName = DOCUMENTATION_INDEX[category][name];
  }
  
  // Build the absolute path to the file
  const filePath = path.join(getAiDocsPath(), category, fileName);
  
  // Check if we have a cached version
  if (docsCache.has(filePath)) {
    return docsCache.get(filePath);
  }
  
  // Read the file
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Cache the content
    docsCache.set(filePath, content);
    return content;
  } catch (error) {
    throw new Error(`Failed to read documentation file: ${filePath} - ${error.message}`);
  }
}

/**
 * Clear the documentation cache
 * Useful for testing or after file changes
 */
function clearCache() {
  docsCache.clear();
}

/**
 * Split markdown content into sections based on headings
 * 
 * @param {string} markdown - Raw markdown content
 * @returns {Object} Object with section names as keys and content as values
 */
function parseSections(markdown) {
  // Extract top-level heading (# Title)
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Document';
  
  // Initial result object with the title
  const result = {
    title,
    sections: {}
  };
  
  // Find all second-level headings (## Heading) and their content
  // Using split on ## headers to ensure we capture all content between sections
  const sections = markdown.split(/^##\s+/m).slice(1);
  
  for (const section of sections) {
    const titleEndIdx = section.indexOf('\n');
    if (titleEndIdx === -1) continue;
    
    const sectionName = section.substring(0, titleEndIdx).trim().toLowerCase();
    let sectionContent = section.substring(titleEndIdx + 1).trim();
    
    // Convert section name to camelCase for easier programmatic access
    const camelCaseName = sectionName
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, (_, char) => char.toLowerCase());
    
    result.sections[camelCaseName] = sectionContent;
  }
  
  return result;
}

/**
 * Extract a specific section from parsed markdown content
 * 
 * @param {Object} parsedMarkdown - Parsed markdown object
 * @param {string} sectionName - Name of the section to extract
 * @returns {string|null} Section content or null if not found
 */
function extractSection(parsedMarkdown, sectionName) {
  if (!parsedMarkdown || !parsedMarkdown.sections) {
    return null;
  }
  
  // Convert section name to camelCase for lookup
  const camelCaseName = sectionName
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, '')
    .replace(/^(.)/, (_, char) => char.toLowerCase());
  
  return parsedMarkdown.sections[camelCaseName] || null;
}

/**
 * Extract a list of items from a markdown section
 * 
 * @param {string} sectionContent - Content of a markdown section
 * @returns {Array<string>} Array of list items without bullets
 */
function extractListItems(sectionContent) {
  if (!sectionContent) {
    return [];
  }
  
  // Match list items with various bullet styles (-, *, •)
  const listItemRegex = /^[\s]*[-*•][\s]+(.+)$/gm;
  const items = [];
  let match;
  
  while ((match = listItemRegex.exec(sectionContent)) !== null) {
    items.push(match[1].trim());
  }
  
  return items;
}

/**
 * Extract code blocks from a markdown section
 * 
 * @param {string} sectionContent - Content of a markdown section
 * @param {string} [language] - Optional language filter
 * @returns {Array<{language: string, code: string}>} Array of code blocks
 */
function extractCodeBlocks(sectionContent, language = null) {
  if (!sectionContent) {
    return [];
  }
  
  // Match fenced code blocks with optional language specification
  const codeBlockRegex = /```([\w]*)\n([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(sectionContent)) !== null) {
    const blockLanguage = match[1].trim();
    const code = match[2].trim();
    
    // Filter by language if specified
    if (!language || blockLanguage === language) {
      codeBlocks.push({
        language: blockLanguage,
        code
      });
    }
  }
  
  return codeBlocks;
}

/**
 * Extract JSON examples from code blocks
 * 
 * @param {string} sectionContent - Content of a markdown section
 * @returns {Array<Object>} Array of parsed JSON objects
 */
function extractJsonExamples(sectionContent) {
  const jsonBlocks = extractCodeBlocks(sectionContent, 'json');
  
  return jsonBlocks.map(block => {
    try {
      return JSON.parse(block.code);
    } catch (error) {
      // Return unparsed code if it's not valid JSON
      return { 
        _parsingError: true,
        originalCode: block.code 
      };
    }
  });
}

/**
 * Load role documentation
 * 
 * @param {string} role - Role identifier (pm, developer, reviewer)
 * @returns {Object} Structured role documentation
 */
function loadRoleDoc(role) {
  // Normalize role name
  const normalizedRole = role === 'pm' ? 'project-manager' : role === 'dev' ? 'developer' : role;
  
  try {
    // Load the markdown file
    const markdown = loadMarkdownFile('roles', normalizedRole);
    
    // Parse into sections
    const parsed = parseSections(markdown);
    
    // Extract relevant data for role documentation
    // Handle various best practices section names
    const bestPracticesSection = 
      extractSection(parsed, 'Best Practices') || 
      extractSection(parsed, 'General Best Practices') ||
      extractSection(parsed, 'Task Implementation Best Practices');
    
    return {
      title: parsed.title,
      description: extractSection(parsed, 'Introduction') || extractSection(parsed, 'Overview'),
      workflows: extractListItems(extractSection(parsed, 'Recommended Workflows')),
      bestPractices: extractListItems(bestPracticesSection),
      toolUsageMap: extractSection(parsed, 'Tool Usage Map') || extractSection(parsed, 'Developer Tool Usage Guide'),
      toolExamples: extractJsonExamples(extractSection(parsed, 'Tool Usage Map') || extractSection(parsed, 'Developer Tool Usage Guide'))
    };
  } catch (error) {
    throw new Error(`Failed to load role documentation for '${role}': ${error.message}`);
  }
}

/**
 * Load workflow documentation
 * 
 * @param {string} workflow - Workflow identifier
 * @returns {Object} Structured workflow documentation
 */
function loadWorkflowDoc(workflow) {
  try {
    // Load the markdown file
    const markdown = loadMarkdownFile('workflows', workflow);
    
    // Parse into sections
    const parsed = parseSections(markdown);
    
    // Extract tool sequence examples
    const exampleJson = extractJsonExamples(extractSection(parsed, 'Example Tool Sequence'));
    
    // Extract relevant data for workflow documentation
    return {
      title: parsed.title,
      description: extractSection(parsed, 'Overview') || extractSection(parsed, 'Description'),
      steps: extractListItems(extractSection(parsed, 'Steps')),
      exampleToolSequence: exampleJson.length > 0 ? exampleJson[0] : null,
      tips: extractListItems(extractSection(parsed, 'Tips'))
    };
  } catch (error) {
    throw new Error(`Failed to load workflow documentation for '${workflow}': ${error.message}`);
  }
}

/**
 * List available workflows
 * 
 * @returns {Array<{id: string, title: string, description: string}>} Available workflows
 */
function listWorkflows() {
  return Object.keys(DOCUMENTATION_INDEX.workflows).map(workflowId => {
    try {
      const workflowDoc = loadWorkflowDoc(workflowId);
      return {
        id: workflowId,
        title: workflowDoc.title,
        description: workflowDoc.description
      };
    } catch (error) {
      // Return basic info if detailed loading fails
      return {
        id: workflowId,
        title: workflowId.replace(/-/g, ' '),
        description: 'Documentation unavailable'
      };
    }
  });
}

/**
 * Load best practice documentation
 * 
 * @param {string} practiceType - Best practice type
 * @returns {Object} Structured best practice documentation
 */
function loadBestPracticeDoc(practiceType) {
  try {
    // Load the markdown file
    const markdown = loadMarkdownFile('best-practices', practiceType);
    
    // Parse into sections
    const parsed = parseSections(markdown);
    
    // Return all sections as they might vary between best practice types
    return {
      title: parsed.title,
      sections: parsed.sections
    };
  } catch (error) {
    throw new Error(`Failed to load best practice documentation for '${practiceType}': ${error.message}`);
  }
}

module.exports = {
  loadRoleDoc,
  loadWorkflowDoc,
  listWorkflows,
  loadBestPracticeDoc,
  loadMarkdownFile,
  parseSections,
  extractSection,
  extractListItems,
  extractCodeBlocks,
  extractJsonExamples,
  getAiDocsPath,
  clearCache,
  // Export for testing
  __test__: {
    DOCUMENTATION_INDEX
  }
};