#!/usr/bin/env node

// ABOUTME: CLI script for validating links in documentation
// ABOUTME: Ensures all links in documentation files are valid and accessible

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const linkValidator = require('../utils/linkValidator');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  checkExternal: args.includes('--external') || args.includes('-e'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  outputFile: null,
  failOnError: true,
  directory: null
};

// Process command line options
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--output' || args[i] === '-o') && i + 1 < args.length) {
    options.outputFile = args[i + 1];
    i++;
  } else if ((args[i] === '--dir' || args[i] === '-d') && i + 1 < args.length) {
    options.directory = args[i + 1];
    i++;
  } else if (args[i] === '--no-fail') {
    options.failOnError = false;
  }
}

// Set default directory if not specified
if (!options.directory) {
  options.directory = path.join(__dirname, '../../docs');
}

/**
 * Format validation results for text output
 * @param {Object} validation - Validation results 
 * @returns {string} Formatted output text
 */
function formatResults(validation) {
  const { results, summary } = validation;
  
  let output = `# Link Validation Report\n\n`;
  
  // Add summary
  output += `## Summary\n\n`;
  output += `- Total files checked: ${summary.totalFiles}\n`;
  output += `- Total links checked: ${summary.totalLinks}\n`;
  output += `- Valid links: ${summary.validLinks}\n`;
  output += `- Warnings: ${summary.warnings}\n`;
  output += `- Errors: ${summary.errors}\n\n`;
  
  // Group results by file
  const fileResults = {};
  
  results.filter(r => !r.result.valid || r.result.warning).forEach(result => {
    const relativePath = path.relative(process.cwd(), result.link.filePath);
    
    if (!fileResults[relativePath]) {
      fileResults[relativePath] = [];
    }
    
    fileResults[relativePath].push(result);
  });
  
  // Add results by file
  if (Object.keys(fileResults).length > 0) {
    output += `## Issues by File\n\n`;
    
    for (const [filePath, issues] of Object.entries(fileResults)) {
      output += `### ${filePath}\n\n`;
      
      for (const issue of issues) {
        const { link, result } = issue;
        const status = result.valid ? 'WARNING' : 'ERROR';
        const reason = result.reason || result.warning;
        
        output += `- [${status}] Line ${link.line}: "${link.text}" -> "${link.url}"\n`;
        output += `  ${reason}\n\n`;
      }
    }
  }
  
  return output;
}

/**
 * Main validation function
 */
async function validateLinks() {
  console.log(chalk.blue(`Validating links in ${options.directory}${options.checkExternal ? ' (including external links)' : ''}...`));
  
  try {
    // Find all markdown files
    const files = await linkValidator.findMarkdownFiles(options.directory);
    console.log(chalk.blue(`Found ${files.length} markdown files to check.`));
    
    // Validate links
    const validation = await linkValidator.validateLinks(files, {
      checkExternal: options.checkExternal,
      repoRoot: path.resolve(__dirname, '../..')
    });
    
    // Log summary
    console.log(chalk.blue('\nLink Validation Summary:'));
    console.log(chalk.blue(`Total files checked: ${validation.summary.totalFiles}`));
    console.log(chalk.blue(`Total links checked: ${validation.summary.totalLinks}`));
    console.log(chalk.green(`Valid links: ${validation.summary.validLinks}`));
    console.log(chalk.yellow(`Warnings: ${validation.summary.warnings}`));
    console.log(chalk.red(`Errors: ${validation.summary.errors}`));
    
    // Log detailed results if verbose
    if (options.verbose) {
      // Group results by file
      const fileResults = {};
      validation.results.filter(r => !r.result.valid || r.result.warning).forEach(result => {
        const relativePath = path.relative(process.cwd(), result.link.filePath);
        
        if (!fileResults[relativePath]) {
          fileResults[relativePath] = [];
        }
        
        fileResults[relativePath].push(result);
      });
      
      // Print issues by file
      for (const [filePath, issues] of Object.entries(fileResults)) {
        console.log(chalk.blue(`\nIssues in ${filePath}:`));
        
        for (const issue of issues) {
          const { link, result } = issue;
          const status = !result.valid ? 'ERROR' : 'WARNING';
          const statusColor = !result.valid ? chalk.red : chalk.yellow;
          const reason = result.reason || result.warning;
          
          console.log(statusColor(`  [${status}] Line ${link.line}: "${link.text}" -> "${link.url}"`));
          console.log(statusColor(`    ${reason}`));
        }
      }
    }
    
    // Output to file if specified
    if (options.outputFile) {
      const formatted = formatResults(validation);
      fs.writeFileSync(options.outputFile, formatted);
      console.log(chalk.blue(`\nDetailed results written to: ${options.outputFile}`));
    }
    
    // Exit with appropriate code
    if (validation.summary.errors > 0 && options.failOnError) {
      console.error(chalk.red('\nValidation failed due to errors. Fix link issues and try again.'));
      process.exit(1);
    } else {
      console.log(chalk.green('\nValidation complete.'));
      process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red('Error validating links:'), error);
    process.exit(1);
  }
}

// Run validation
validateLinks();