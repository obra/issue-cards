# Documentation Centralization Plan

## Current Documentation Analysis

The issue-cards project currently has documentation spread across multiple locations:

1. **In-app CLI help system**
   - Commander.js built-in `--help` flag for each command
   - Custom `help` command in `src/commands/help.js` (limited to 'env' topic)
   - Command descriptions in each command file

2. **Markdown documentation in /docs**
   - Comprehensive command reference in `commands.md`
   - Environment variables reference in `environment-variables.md`
   - AI integration guides in multiple files
   - Design decisions in `/design-decisions/`

3. **Tutorial documentation**
   - Main tutorial in `tutorial.md` at project root
   - Specific tutorial in `tutorial/issue-cards-tutorial.md`
   - Tutorial test script in `tutorial-test.sh`

4. **README.md documentation**
   - Project overview and feature summary
   - Quick start guide
   - Brief command reference
   - Links to detailed documentation

## Issues with Current Approach

1. **Duplication of content**
   - Commands documented in 3+ places with varying levels of detail
   - Environment variables documented in both help command and markdown
   - Tutorial examples duplicate command references

2. **Fragmentation of information**
   - AI integration documentation spread across 5+ files
   - Help content split between CLI and markdown files

3. **Maintenance challenges**
   - Changes to commands require updates in multiple places
   - Documentation inconsistencies when updates occur in one place but not others

4. **Limited in-app access**
   - Most detailed documentation is external to the app
   - CLI help system is significantly less comprehensive than markdown docs

## Proposed Solution

Our approach focuses on:

1. **Use Commander.js for Command Documentation**
   - Command definitions (parameters, options, aliases) remain in code
   - Enhanced Commander.js usage for rich command help
   - Command documentation accessed via standard `--help` flags

2. **Markdown-Based Conceptual Documentation**
   - Well-structured markdown files for tutorials, guides, and reference
   - Auto-discovered by the help system
   - No duplication of command parameters

3. **Auto-Discovering Help Command**
   - Enhanced help command that discovers and renders markdown files
   - Serves as a central entry point for all documentation
   - Formats markdown for terminal display

## Documentation Structure

```
/docs
├── getting-started.md           # Quick start guide
├── tutorials/                   # Guided learning materials
│   ├── basic-workflow.md        
│   ├── advanced-features.md     
│   └── task-management.md      
├── guides/                      # How-to guides 
│   ├── git-integration.md
│   ├── templates-customization.md
│   └── ai-integration.md
├── reference/                   # Technical reference
│   ├── environment-vars.md
│   ├── templates.md
│   ├── output-formats.md
│   └── tag-expansion.md
└── design/                      # Design decisions
    ├── command-update-plan.md
    └── output-implementation-plan.md
```

## Implementation Plan

### Phase 1: Enhance Command Documentation

1. **Improve Commander.js Usage**
   - Ensure every command has detailed descriptions
   - Add comprehensive examples to all commands
   - Use `.addHelpText()` for rich help output

Example for enhancing command documentation:

```javascript
function createCommand() {
  const command = new Command('create')
    .description('Create a new issue from template')
    .argument('<template>', 'Template to use (feature, bugfix, refactor, audit)')
    .option('--title <issueTitle>', 'Issue title (required)')
    .option('--problem <problemDesc>', 'Description of the problem to solve')
    // ...other options
    .action(createAction);

  // Add rich help text with examples
  command.addHelpText('after', `
Examples:
  $ issue-cards create feature --title "New login system"
  $ issue-cards create bugfix --title "Fix login redirect" --problem "Redirect fails on mobile"
  $ issue-cards create refactor --title "Refactor authentication" --task "Extract auth logic" --task "Add tests"

Available Templates:
  - feature - For implementing new features
  - bugfix  - For fixing bugs
  - refactor - For code improvement without changing functionality
  - audit - For security and performance review

See 'issue-cards help templates' for more details on templates.
  `);
  
  return command;
}
```

### Phase 2: Implement Auto-Discovering Help Command

Create a help command that discovers markdown documentation and displays it in the terminal:

```javascript
// src/commands/help.js
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const outputManager = require('../utils/outputManager');

/**
 * Discover all documentation files
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
  return categories;
}

/**
 * Format markdown for terminal display
 * @param {string} markdown - Markdown content
 * @returns {string} Formatted text
 */
function formatMarkdownForTerminal(markdown) {
  let formatted = markdown;
  
  // Replace headings
  formatted = formatted.replace(/^# (.*)/gm, (_, title) => 
    outputManager.styles.header(title));
  formatted = formatted.replace(/^## (.*)/gm, (_, title) => 
    outputManager.styles.subheader(title));
  formatted = formatted.replace(/^### (.*)/gm, (_, title) => 
    outputManager.styles.bold(title));
  
  // Handle code blocks
  formatted = formatted.replace(/```([^`]+)```/gms, (_, code) => 
    outputManager.styles.code(code));
  
  // Handle inline code
  formatted = formatted.replace(/`([^`]+)`/g, (_, code) => 
    outputManager.styles.inline(code));
  
  // Handle lists
  formatted = formatted.replace(/^- (.*)/gm, (_, item) => 
    `  • ${item}`);
  
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
  outputManager.code('issue-cards <command> --help');
  outputManager.empty();
  
  // Then show all other documentation
  for (const [category, docs] of Object.entries(categories)) {
    outputManager.subheader(category.charAt(0).toUpperCase() + category.slice(1));
    
    for (const doc of docs) {
      outputManager.keyValue(doc.path, doc.title);
    }
    
    outputManager.empty();
  }
  
  outputManager.info('Run `issue-cards help <topic>` to view a specific topic');
}

/**
 * Show help for a specific topic
 * @param {string} topicPath - Path to the requested topic
 */
function showTopic(topicPath) {
  const categories = discoverDocFiles();
  let docFile = null;
  
  // Find the requested topic
  for (const docs of Object.values(categories)) {
    const doc = docs.find(d => d.path === topicPath);
    if (doc) {
      docFile = doc.fullPath;
      break;
    }
  }
  
  if (!docFile) {
    outputManager.error(`Topic '${topicPath}' not found`);
    outputManager.info('Run `issue-cards help` to see all available topics');
    return;
  }
  
  // Read and render the markdown file
  const content = fs.readFileSync(docFile, 'utf8');
  const formatted = formatMarkdownForTerminal(content);
  outputManager.raw(formatted);
}

/**
 * Help command action
 */
function helpAction(topic) {
  if (!topic) {
    listTopics();
    return;
  }
  
  showTopic(topic);
}

/**
 * Create help command
 */
function createCommand() {
  return new Command('help')
    .description('Display help for commands and topics')
    .argument('[topic]', 'Help topic to display')
    .action(helpAction)
    .addHelpText('after', `
Examples:
  $ issue-cards help                    # List all available topics
  $ issue-cards help tutorials/basic    # View the basic tutorial
  $ issue-cards help reference/env      # View environment variables reference
  
For command-specific help, use:
  $ issue-cards <command> --help        # e.g., issue-cards create --help
`);
}

module.exports = { createCommand };
```

### Phase 3: Restructure and Consolidate Documentation

1. **Reorganize Existing Documentation**
   - Move content from tutorial.md into `/docs/tutorials/`
   - Refactor README.md to link to help system
   - Consolidate similar topics

2. **Create New Documentation Files**
   - Focus on non-command documentation
   - Create index files for categories
   - Ensure comprehensive coverage

3. **Update Cross-References**
   - Add links between related topics
   - Reference commands correctly

Example of a well-structured markdown file:

```markdown
# Task Management Guide

This guide explains how to manage tasks within issues.

## Adding Tasks

To add tasks to an issue, use the `add-task` command:

```bash
issue-cards add-task "Implement login form"
```

For details on all options, see `issue-cards add-task --help`.

## Working with Tasks

The current task is the first incomplete task in the issue.
To view the current task:

```bash
issue-cards current
```

## Completing Tasks

Mark tasks as complete with:

```bash
issue-cards complete-task
```

## Related Topics

- [Tag Expansion](../reference/tag-expansion.md)
```

## Documentation Example: Create Command

When using the enhanced command help system, the `create` command documentation would look like this in the terminal:

```
Usage: issue-cards create <template> [options]

Create a new issue from template

Arguments:
  template  Template to use (feature, bugfix, refactor, audit)

Options:
  --title <issueTitle>               Issue title (required)
  --problem <problemDesc>            Description of the problem to solve
  --approach <approachDesc>          Planned approach for solving the issue
  --failed-approaches <approachesList>  List of approaches already tried (one per line)
  --questions <questionsList>        List of questions that need answers (one per line)
  --task <taskDesc>                  A task to add to the issue (can be used multiple times)
  --instructions <instructionsText>  Guidelines to follow during implementation
  -h, --help                         display help for command

Examples:
  $ issue-cards create feature --title "New login system"
  $ issue-cards create bugfix --title "Fix login redirect" --problem "Redirect fails on mobile"
  $ issue-cards create refactor --title "Refactor authentication" --task "Extract auth logic" --task "Add tests"

Available Templates:
  - feature - For implementing new features
  - bugfix  - For fixing bugs
  - refactor - For code improvement without changing functionality
  - audit - For security and performance review

See 'issue-cards help templates' for more details on templates.
```

## Benefits of This Approach

1. **No Documentation Generator Required**
   - Simpler implementation
   - No build step needed
   - Direct editing of markdown files

2. **Single Access Point**
   - All documentation accessed via `help` command
   - Standard command help still available
   - Consistent user experience

3. **Easy Maintenance**
   - Add new docs by simply creating markdown files
   - No duplication of command details
   - Clear separation of concerns

4. **Future Extensibility**
   - System can be enhanced with search
   - Support for additional formatting
   - Potential for interactive documentation

## Next Steps

1. Enhance the `help` command with auto-discovery
2. Restructure the docs directory according to the proposed structure
3. Review and enhance command descriptions in Commander.js definitions
4. Begin migrating tutorial content to the new structure
5. Update README to reference the new help system