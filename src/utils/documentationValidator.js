// ABOUTME: Validates AI documentation files for correctness and completeness
// ABOUTME: Ensures consistency across all documentation used by onboarding tools

const fs = require('fs');
const path = require('path');
const documentationParser = require('./documentationParser');
const { getAiDocsPath } = documentationParser;
const DOCUMENTATION_INDEX = documentationParser.__test__.DOCUMENTATION_INDEX;

/**
 * Represents a validation issue found in documentation
 */
class ValidationIssue {
  /**
   * Create a new validation issue
   * 
   * @param {string} type - Type of issue (error, warning, info)
   * @param {string} file - File path where issue was found
   * @param {string} message - Description of the issue
   * @param {string} [section] - Section where issue was found
   */
  constructor(type, file, message, section = null) {
    this.type = type;
    this.file = file;
    this.message = message;
    this.section = section;
    this.timestamp = new Date();
  }

  /**
   * Format the issue for display
   * 
   * @returns {string} Formatted issue description
   */
  toString() {
    let result = `[${this.type.toUpperCase()}] ${this.file}`;
    if (this.section) {
      result += ` (Section: ${this.section})`;
    }
    result += `: ${this.message}`;
    return result;
  }
}

/**
 * Required sections for each type of documentation file
 */
const REQUIRED_SECTIONS = {
  roles: {
    // Project manager, developer, reviewer
    sections: ['introduction', 'recommendedWorkflows', 'bestPractices', 'toolUsageMap'],
    description: 'Role documentation must have Introduction, Recommended Workflows, Best Practices, and Tool Usage Map sections'
  },
  workflows: {
    // Create feature, bugfix, etc.
    sections: ['overview', 'steps', 'exampleToolSequence', 'tips'],
    description: 'Workflow documentation must have Overview, Steps, Example Tool Sequence, and Tips sections'
  },
  'best-practices': {
    // Each file can have a unique structure
    // We'll check for at least one section with content
    minSections: 1,
    description: 'Best practices documentation must have at least one section with content'
  },
  'tool-examples': {
    // Each file should have examples
    codeBlocks: 1,
    description: 'Tool examples documentation must have at least one code block with example'
  }
};

/**
 * Parse a markdown file into sections
 * 
 * @param {string} filePath - Path to the markdown file
 * @returns {Object} Object with parsed sections or error
 */
function parseMarkdownSections(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Document';
    
    const sections = {};
    const sectionRegex = /^##\s+(.+?)$([\s\S]*?)(?=^##\s+|\s*$)/gm;
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionName = match[1].trim().toLowerCase();
      const sectionContent = match[2].trim();
      
      // Convert section name to camelCase for easier programmatic access
      const camelCaseName = sectionName
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
        .replace(/\s/g, '')
        .replace(/^(.)/, (_, char) => char.toLowerCase());
      
      sections[camelCaseName] = sectionContent;
    }
    
    // Count code blocks
    const codeBlocksMatch = content.match(/```[\s\S]*?```/g);
    const codeBlocksCount = codeBlocksMatch ? codeBlocksMatch.length : 0;
    
    return {
      title,
      sections,
      codeBlocksCount,
      sectionCount: Object.keys(sections).length
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Validate a single documentation file
 * 
 * @param {string} category - Documentation category (roles, workflows, etc.)
 * @param {string} fileName - Name of the documentation file
 * @returns {Array<ValidationIssue>} Array of validation issues
 */
function validateDocumentationFile(category, fileName) {
  const issues = [];
  const filePath = path.join(getAiDocsPath(), category, fileName);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    issues.push(new ValidationIssue('error', filePath, `File does not exist`));
    return issues;
  }
  
  // Parse file
  const parsed = parseMarkdownSections(filePath);
  
  // Check for parsing errors
  if (parsed.error) {
    issues.push(new ValidationIssue('error', filePath, `Failed to parse: ${parsed.error}`));
    return issues;
  }
  
  // Check title
  if (!parsed.title || parsed.title === 'Untitled Document') {
    issues.push(new ValidationIssue('error', filePath, 'Missing title (# Title)'));
  }
  
  // Check for required sections based on category
  if (REQUIRED_SECTIONS[category]) {
    const requirements = REQUIRED_SECTIONS[category];
    
    // Check for specific required sections
    if (requirements.sections) {
      for (const requiredSection of requirements.sections) {
        if (!parsed.sections[requiredSection] || !parsed.sections[requiredSection].trim()) {
          issues.push(new ValidationIssue(
            'error', 
            filePath, 
            `Missing required section: ${requiredSection}`,
            requiredSection
          ));
        }
      }
    }
    
    // Check for minimum number of sections
    if (requirements.minSections && parsed.sectionCount < requirements.minSections) {
      issues.push(new ValidationIssue(
        'error', 
        filePath, 
        `Insufficient sections: has ${parsed.sectionCount}, needs at least ${requirements.minSections}`
      ));
    }
    
    // Check for minimum number of code blocks
    if (requirements.codeBlocks && parsed.codeBlocksCount < requirements.codeBlocks) {
      issues.push(new ValidationIssue(
        'error', 
        filePath, 
        `Insufficient code examples: has ${parsed.codeBlocksCount}, needs at least ${requirements.codeBlocks}`
      ));
    }
  }
  
  // Check for section content length
  for (const [sectionName, content] of Object.entries(parsed.sections)) {
    if (content.length < 10) {
      issues.push(new ValidationIssue(
        'warning', 
        filePath, 
        `Section has minimal content (${content.length} chars)`,
        sectionName
      ));
    }
  }
  
  return issues;
}

/**
 * Validate all documentation files in a category
 * 
 * @param {string} category - Documentation category (roles, workflows, etc.) 
 * @returns {Array<ValidationIssue>} Array of validation issues
 */
function validateCategory(category) {
  const issues = [];
  const categoryPath = path.join(getAiDocsPath(), category);
  
  // Check if category directory exists
  if (!fs.existsSync(categoryPath)) {
    issues.push(new ValidationIssue('error', categoryPath, `Category directory does not exist`));
    return issues;
  }
  
  // Get all markdown files in the directory
  const files = fs.readdirSync(categoryPath)
    .filter(file => file.endsWith('.md') && !file.startsWith('README'));
  
  // Check if category has any files
  if (files.length === 0) {
    issues.push(new ValidationIssue('error', categoryPath, `No documentation files found`));
    return issues;
  }
  
  // Validate each file
  for (const file of files) {
    const fileIssues = validateDocumentationFile(category, file);
    issues.push(...fileIssues);
  }
  
  // Check if all expected files exist based on the documentation index
  if (DOCUMENTATION_INDEX[category]) {
    const expectedFiles = Object.values(DOCUMENTATION_INDEX[category]);
    for (const expectedFile of expectedFiles) {
      if (!files.includes(expectedFile)) {
        issues.push(new ValidationIssue(
          'error', 
          path.join(categoryPath, expectedFile), 
          `Expected file is missing from documentation`
        ));
      }
    }
  }
  
  return issues;
}

/**
 * Validate documentation cross-references
 * 
 * @returns {Array<ValidationIssue>} Array of validation issues
 */
function validateCrossReferences() {
  const issues = [];
  const baseDir = getAiDocsPath();
  
  // Function to extract links from markdown content
  const extractLinks = (content) => {
    const linkRegex = /\[.*?\]\((.*?)\)/g;
    const links = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    return links;
  };
  
  // Check all markdown files recursively
  const checkDirectory = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        checkDirectory(fullPath);
      } else if (entry.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const links = extractLinks(content);
          
          // Check each link
          for (const link of links) {
            // Skip external links
            if (link.startsWith('http')) continue;
            
            // Resolve relative path
            const resolved = path.resolve(path.dirname(fullPath), link);
            const relativePath = path.relative(baseDir, resolved);
            
            // Check if link target exists
            if (!fs.existsSync(resolved)) {
              issues.push(new ValidationIssue(
                'error',
                fullPath,
                `Broken link: ${link} (resolves to ${relativePath})`
              ));
            }
          }
        } catch (error) {
          issues.push(new ValidationIssue(
            'error',
            fullPath,
            `Error checking links: ${error.message}`
          ));
        }
      }
    }
  };
  
  checkDirectory(baseDir);
  return issues;
}

/**
 * Validate all AI documentation
 * 
 * @returns {Object} Validation results with issues by category
 */
function validateAllDocumentation() {
  const results = {
    categories: {},
    crossReferences: [],
    summary: {
      errors: 0,
      warnings: 0,
      total: 0
    }
  };
  
  // Validate each category
  for (const category of Object.keys(DOCUMENTATION_INDEX)) {
    const issues = validateCategory(category);
    results.categories[category] = issues;
    
    // Update summary counts
    for (const issue of issues) {
      results.summary.total++;
      if (issue.type === 'error') results.summary.errors++;
      if (issue.type === 'warning') results.summary.warnings++;
    }
  }
  
  // Validate cross-references
  const crossRefIssues = validateCrossReferences();
  results.crossReferences = crossRefIssues;
  
  // Update summary counts for cross-references
  for (const issue of crossRefIssues) {
    results.summary.total++;
    if (issue.type === 'error') results.summary.errors++;
    if (issue.type === 'warning') results.summary.warnings++;
  }
  
  return results;
}

/**
 * Formats validation results for display
 * 
 * @param {Object} results - Validation results from validateAllDocumentation
 * @returns {string} Formatted validation report
 */
function formatValidationResults(results) {
  let output = `# AI Documentation Validation Report\n\n`;
  
  // Add summary
  output += `## Summary\n\n`;
  output += `- Total issues: ${results.summary.total}\n`;
  output += `- Errors: ${results.summary.errors}\n`;
  output += `- Warnings: ${results.summary.warnings}\n\n`;
  
  // Add category issues
  for (const [category, issues] of Object.entries(results.categories)) {
    if (issues.length === 0) continue;
    
    output += `## ${category}\n\n`;
    
    for (const issue of issues) {
      output += `- ${issue.toString()}\n`;
    }
    
    output += '\n';
  }
  
  // Add cross-reference issues
  if (results.crossReferences.length > 0) {
    output += `## Cross-References\n\n`;
    
    for (const issue of results.crossReferences) {
      output += `- ${issue.toString()}\n`;
    }
    
    output += '\n';
  }
  
  return output;
}

module.exports = {
  validateDocumentationFile,
  validateCategory,
  validateAllDocumentation,
  formatValidationResults,
  ValidationIssue
};