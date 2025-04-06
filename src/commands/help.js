// ABOUTME: Help command for providing interactive CLI documentation
// ABOUTME: Auto-discovers and displays markdown documentation from docs directory

const { Command } = require('commander');
const outputManager = require('../utils/outputManager');
const fs = require('fs');
const path = require('path');

/**
 * Discover all documentation files in the docs directory
 * 
 * @returns {Object} Categories and documents
 */
function discoverDocFiles() {
  const docsDir = path.join(__dirname, '../../docs');
  const categories = {};
  
  // Find all markdown files in docs directory (recursively)
  const findMarkdownFiles = (dir, prefix = '') => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Add category
        const categoryName = file;
        findMarkdownFiles(fullPath, `${prefix}${categoryName}/`);
      } else if (file.endsWith('.md')) {
        // Add document
        const name = path.basename(file, '.md');
        const category = prefix ? prefix.split('/')[0] : 'general';
        
        if (!categories[category]) {
          categories[category] = [];
        }
        
        // Extract title from markdown
        const content = fs.readFileSync(fullPath, 'utf8');
        const titleMatch = content.match(/^#\s+(.*)$/m);
        const title = titleMatch ? titleMatch[1] : name;
        
        categories[category].push({
          name,
          path: prefix + name,
          title,
          fullPath
        });
      }
    }
  };
  
  findMarkdownFiles(docsDir);
  
  // Always add env as a built-in topic if it doesn't exist
  if (!categories.general || !categories.general.find(doc => doc.name === 'env')) {
    if (!categories.general) {
      categories.general = [];
    }
    categories.general.push({
      name: 'env',
      path: 'env',
      title: 'Environment Variables',
      builtin: true
    });
  }
  
  return categories;
}

/**
 * Format markdown for terminal display
 * 
 * @param {string} markdown - Markdown content
 * @returns {string} Formatted text for terminal
 */
function formatMarkdownForTerminal(markdown) {
  let formatted = markdown;
  
  // Replace headings with colored output
  formatted = formatted.replace(/^# (.*)/gm, (_, title) => 
    chalk.bold.cyan(`\n${title}\n${'-'.repeat(title.length)}`));
  
  formatted = formatted.replace(/^## (.*)/gm, (_, title) => 
    chalk.bold.green(`\n${title}\n${'-'.repeat(title.length)}`));
  
  formatted = formatted.replace(/^### (.*)/gm, (_, title) => 
    chalk.bold(`\n${title}:`));
  
  // Handle code blocks
  formatted = formatted.replace(/```(?:bash)?\n([\s\S]*?)\n```/gm, (_, code) => 
    `\n${chalk.gray('-'.repeat(40))}\n${chalk.yellow(code.trim())}\n${chalk.gray('-'.repeat(40))}\n`);
  
  // Handle inline code
  formatted = formatted.replace(/`([^`]+)`/g, (_, code) => 
    chalk.yellow(code));
  
  // Handle lists
  formatted = formatted.replace(/^- (.*)/gm, (_, item) => 
    `  • ${item}`);
  
  // Handle links - convert [text](url) to "text (url)"
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    if (url.startsWith('http')) {
      // External link
      return `${text} (${chalk.blue(url)})`;
    } else {
      // Internal link - could be to another doc
      return `${text} (see '${chalk.green(url.replace(/\.md$/, ''))}')`;
    }
  });
  
  return formatted;
}

/**
 * List all available documentation topics
 */
function listTopics() {
  const categories = discoverDocFiles();
  
  outputManager.header('Available Documentation');
  
  // Show command help info first
  outputManager.subheader('Commands');
  outputManager.info('For command documentation, use:');
  outputManager.info('  issue-cards <command> --help');
  outputManager.empty();
  
  // Then show all other documentation
  for (const [category, docs] of Object.entries(categories)) {
    // Format category name for display (capitalize first letter)
    const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
    outputManager.subheader(displayCategory);
    
    for (const doc of docs) {
      outputManager.keyValue(doc.path, doc.title);
    }
    
    outputManager.empty();
  }
  
  outputManager.info('Run `issue-cards help <topic>` to view a specific topic');
}

/**
 * Show help for a specific topic
 * 
 * @param {string} topicPath - Path to the requested topic
 */
function showTopic(topicPath) {
  // Special case for built-in env topic
  if (topicPath === 'env') {
    showEnvironmentVariablesHelp();
    return;
  }
  
  const categories = discoverDocFiles();
  let docFile = null;
  
  // Find the requested topic
  for (const docs of Object.values(categories)) {
    const doc = docs.find(d => d.path === topicPath);
    if (doc) {
      if (doc.builtin) {
        // Handle built-in topics
        if (doc.name === 'env') {
          showEnvironmentVariablesHelp();
          return;
        }
      } else {
        docFile = doc.fullPath;
      }
      break;
    }
  }
  
  if (!docFile) {
    outputManager.error(`Topic '${topicPath}' not found`);
    outputManager.info('Run `issue-cards help` to see all available topics');
    return;
  }
  
  try {
    // Read and render the markdown file
    const content = fs.readFileSync(docFile, 'utf8');
    const formatted = formatMarkdownForTerminal(content);
    console.log(formatted);
  } catch (error) {
    outputManager.error(`Error reading documentation: ${error.message}`);
  }
}

/**
 * Display help for environment variables
 */
function showEnvironmentVariablesHelp() {
  outputManager.header('Issue Cards Environment Variables');
  outputManager.info('Environment variables allow you to configure Issue Cards without command-line arguments.');
  outputManager.empty();
  
  // Core configuration variables
  outputManager.subheader('Core Configuration');
  outputManager.keyValue('ISSUE_CARDS_DIR', 'Directory to store issues and templates');
  outputManager.detail('Default: .issues in current working directory');
  outputManager.detail('Example: export ISSUE_CARDS_DIR=/path/to/custom/issues');
  outputManager.empty();
  
  // MCP server variables
  outputManager.subheader('MCP Server Configuration');
  outputManager.keyValue('ISSUE_CARDS_MCP_PORT', 'Port for the MCP server');
  outputManager.detail('Default: 3000');
  outputManager.detail('Example: ISSUE_CARDS_MCP_PORT=8080 issue-cards serve');
  outputManager.empty();
  
  outputManager.keyValue('ISSUE_CARDS_MCP_HOST', 'Host to bind the MCP server to');
  outputManager.detail('Default: localhost');
  outputManager.detail('Example: ISSUE_CARDS_MCP_HOST=0.0.0.0 issue-cards serve');
  outputManager.empty();
  
  outputManager.keyValue('ISSUE_CARDS_MCP_TOKEN', 'Authentication token for the MCP server');
  outputManager.detail('Default: None (authentication disabled)');
  outputManager.detail('Example: ISSUE_CARDS_MCP_TOKEN=my-secret-token issue-cards serve');
  outputManager.empty();
  
  outputManager.keyValue('ISSUE_CARDS_MCP_CORS', 'Enable CORS for the MCP server');
  outputManager.detail('Default: false');
  outputManager.detail('Example: ISSUE_CARDS_MCP_CORS=true issue-cards serve');
  outputManager.empty();
  
  // Testing configuration
  outputManager.subheader('Testing Configuration');
  outputManager.keyValue('NODE_ENV', 'Application environment');
  outputManager.detail('Values: development, production, test');
  outputManager.detail('Example: NODE_ENV=test issue-cards list');
  outputManager.empty();
  
  outputManager.keyValue('E2E_COLLECT_COVERAGE', 'Enable code coverage collection for E2E tests');
  outputManager.detail('Default: false');
  outputManager.detail('Example: E2E_COLLECT_COVERAGE=true npm run test:e2e');
  outputManager.empty();
  
  // Link to detailed documentation
  outputManager.subheader('Detailed Documentation');
  outputManager.info('For complete details on all environment variables, see:');
  outputManager.info('https://github.com/issue-cards/issue-cards/blob/main/docs/reference/environment-vars.md');
  outputManager.info('Or run: issue-cards help reference/environment-vars');
}

/**
 * Execute the help command action
 * 
 * @param {string} topic - The help topic to display
 */
function helpAction(topic) {
  if (!topic) {
    listTopics();
    return;
  }
  
  showTopic(topic);
}

/**
 * Create the help command
 * 
 * @returns {Command} The help command
 */
function createCommand() {
  const command = new Command('help')
    .description('Display help for commands and topics')
    .argument('[topic]', 'Help topic to display')
    .action(helpAction);
  
  // Add rich help text with examples
  command.addHelpText('after', `
Examples:
  $ issue-cards help                      # List all available topics
  $ issue-cards help tutorials/basic      # View the basic workflow tutorial
  $ issue-cards help env                  # View environment variables reference

For command-specific help, use:
  $ issue-cards <command> --help          # e.g., issue-cards create --help
  `);
  
  return command;
}

// Import chalk for text formatting in the terminal
const chalk = require('chalk');

module.exports = { 
  createCommand,
  helpAction,
  // Export for testing
  discoverDocFiles,
  formatMarkdownForTerminal,
  showTopic,
  listTopics
};