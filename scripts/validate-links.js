// ABOUTME: Script to validate links in markdown files
// ABOUTME: Checks both internal and external links for validity

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const marked = require('marked');
const fetch = require('node-fetch');
const chalk = require('chalk');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const REPO_ROOT = path.join(__dirname, '..');

/**
 * Extract all links from a markdown file
 * @param {string} content - The markdown content
 * @returns {Array<{text: string, url: string, line: number}>} - Array of links with text and URL
 */
function extractLinks(content) {
  const links = [];
  const lines = content.split('\n');
  
  // Regular expression for markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  // Process each line
  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      links.push({
        text: match[1],
        url: match[2],
        line: lineIndex + 1
      });
    }
  });
  
  return links;
}

/**
 * Check if an internal link target exists
 * @param {string} filePath - The path of the current file
 * @param {string} url - The link URL
 * @returns {Promise<{valid: boolean, reason?: string}>} - Validation result
 */
async function checkInternalLink(filePath, url) {
  // Handle anchor links
  if (url.startsWith('#')) {
    // We can't easily verify anchors without parsing the HTML structure
    return { valid: true, warning: 'Anchor links cannot be fully validated' };
  }
  
  // Handle relative paths
  let targetPath;
  if (url.startsWith('/')) {
    // Absolute path from repo root
    targetPath = path.join(REPO_ROOT, url);
  } else {
    // Relative path from current file
    const currentDir = path.dirname(filePath);
    targetPath = path.join(currentDir, url);
  }
  
  // Remove any hash fragments
  targetPath = targetPath.split('#')[0];
  
  // Check if the file exists
  try {
    await fs.promises.access(targetPath);
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: `File not found: ${targetPath}` };
  }
}

/**
 * Check if an external link is valid
 * @param {string} url - The URL to check
 * @returns {Promise<{valid: boolean, reason?: string}>} - Validation result
 */
async function checkExternalLink(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 Link Validator'
      }
    });
    
    if (response.ok) {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        reason: `HTTP status: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

/**
 * Validate a link in a markdown file
 * @param {string} filePath - The path to the markdown file
 * @param {Object} link - The link to validate
 * @returns {Promise<{filePath: string, link: Object, result: Object}>} - Validation result
 */
async function validateLink(filePath, link) {
  const { url } = link;
  let result;
  
  // Skip empty links
  if (!url || url.trim() === '') {
    result = { valid: false, reason: 'Empty URL' };
  }
  // Check if the link is external
  else if (url.startsWith('http://') || url.startsWith('https://')) {
    result = await checkExternalLink(url);
  } 
  // Check internal links
  else {
    result = await checkInternalLink(filePath, url);
  }
  
  return { filePath, link, result };
}

/**
 * Validate all links in a markdown file
 * @param {string} filePath - The path to the markdown file
 * @returns {Promise<Array>} - Validation results
 */
async function validateFileLinks(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const links = extractLinks(content);
    const results = [];
    
    for (const link of links) {
      const result = await validateLink(filePath, link);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return [];
  }
}

/**
 * Main function to validate all links in markdown files
 */
async function validateAllLinks() {
  try {
    // Find all markdown files in docs directory
    const files = await glob('**/*.md', { cwd: DOCS_DIR, absolute: true });
    
    const allResults = [];
    let errorCount = 0;
    let warningCount = 0;
    
    console.log(chalk.blue(`Found ${files.length} markdown files to check.`));
    
    // Process each file
    for (const file of files) {
      const relativePath = path.relative(REPO_ROOT, file);
      console.log(chalk.gray(`Checking ${relativePath}...`));
      
      const results = await validateFileLinks(file);
      
      // Count errors and warnings
      results.forEach(result => {
        if (!result.result.valid) {
          errorCount++;
          console.log(chalk.red(`  ✗ [Line ${result.link.line}] ${result.link.text} -> ${result.link.url}`));
          console.log(chalk.red(`    Error: ${result.result.reason}`));
        } else if (result.result.warning) {
          warningCount++;
          console.log(chalk.yellow(`  ⚠ [Line ${result.link.line}] ${result.link.text} -> ${result.link.url}`));
          console.log(chalk.yellow(`    Warning: ${result.result.warning}`));
        } else {
          console.log(chalk.green(`  ✓ [Line ${result.link.line}] ${result.link.text}`));
        }
      });
      
      allResults.push(...results);
    }
    
    // Print summary
    console.log('\n' + chalk.blue('Link Validation Summary:'));
    console.log(chalk.blue(`Total files checked: ${files.length}`));
    console.log(chalk.blue(`Total links checked: ${allResults.length}`));
    console.log(chalk.green(`Valid links: ${allResults.length - errorCount - warningCount}`));
    console.log(chalk.yellow(`Warnings: ${warningCount}`));
    console.log(chalk.red(`Errors: ${errorCount}`));
    
    // Return non-zero exit code if there are errors
    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error validating links:', error);
    process.exit(1);
  }
}

// Run the validation
validateAllLinks();