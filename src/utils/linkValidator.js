// ABOUTME: Validates internal and external links in markdown documentation
// ABOUTME: Used by both tests and CLI tools to ensure documentation quality

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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
 * @param {string} [repoRoot] - Optional repo root path
 * @returns {Promise<{valid: boolean, reason?: string, warning?: string}>} - Validation result
 */
async function checkInternalLink(filePath, url, repoRoot) {
  // Handle anchor links
  if (url.startsWith('#')) {
    // We can't easily verify anchors without parsing the HTML structure
    return { valid: true, warning: 'Anchor links cannot be fully validated' };
  }
  
  // Handle relative paths
  let targetPath;
  const rootPath = repoRoot || path.resolve(path.dirname(filePath), '../..');
  
  if (url.startsWith('/')) {
    // Absolute path from repo root
    targetPath = path.join(rootPath, url);
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
 * @returns {Promise<{valid: boolean, reason?: string, warning?: string}>} - Validation result
 */
async function checkExternalLink(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 Link Validator (issue-cards)'
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
 * Find all markdown files in a directory
 * @param {string} dir - The directory to search
 * @returns {Promise<string[]>} - Array of file paths
 */
async function findMarkdownFiles(dir) {
  const files = [];
  
  async function scan(directory) {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

/**
 * Validate a single link in a markdown file
 * @param {Object} link - The link to validate with filePath and url properties
 * @param {boolean} [checkExternal=true] - Whether to check external links
 * @param {string} [repoRoot] - Optional repo root path
 * @returns {Promise<{link: Object, result: Object}>} - Validation result
 */
async function validateLink(link, checkExternal = true, repoRoot) {
  const { url, filePath } = link;
  let result;
  
  // Skip empty links
  if (!url || url.trim() === '') {
    result = { valid: false, reason: 'Empty URL' };
  }
  // Check if the link is external
  else if (url.startsWith('http://') || url.startsWith('https://')) {
    if (checkExternal) {
      result = await checkExternalLink(url);
    } else {
      result = { valid: true, warning: 'External links are skipped' };
    }
  } 
  // Check internal links
  else {
    result = await checkInternalLink(filePath, url, repoRoot);
  }
  
  return { link, result };
}

/**
 * Validate all links in a set of markdown files
 * @param {Array<string>} filePaths - Array of file paths to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.checkExternal=true] - Whether to check external links
 * @param {string} [options.repoRoot] - Optional repository root path
 * @returns {Promise<{results: Array, summary: Object}>} - Validation results and summary
 */
async function validateLinks(filePaths, options = {}) {
  const { checkExternal = true, repoRoot } = options;
  const allLinks = [];
  const results = [];
  let errorCount = 0;
  let warningCount = 0;
  
  // Extract links from all files
  for (const filePath of filePaths) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const links = extractLinks(content);
      
      // Add file path to each link
      links.forEach(link => {
        allLinks.push({
          ...link,
          filePath
        });
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }
  
  // Group links by domain to avoid rate limiting
  const linksByDomain = { internal: [] };
  
  allLinks.forEach(link => {
    if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
      try {
        const url = new URL(link.url);
        const domain = url.hostname;
        
        if (!linksByDomain[domain]) {
          linksByDomain[domain] = [];
        }
        
        linksByDomain[domain].push(link);
      } catch (error) {
        // Handle invalid URLs
        results.push({
          link,
          result: { valid: false, reason: `Invalid URL: ${error.message}` }
        });
        errorCount++;
      }
    } else {
      linksByDomain.internal.push(link);
    }
  });
  
  // Check internal links
  for (const link of linksByDomain.internal) {
    const result = await validateLink(link, checkExternal, repoRoot);
    results.push(result);
    
    if (!result.result.valid) {
      errorCount++;
    } else if (result.result.warning) {
      warningCount++;
    }
  }
  
  // Check external links if enabled
  if (checkExternal) {
    delete linksByDomain.internal;
    
    for (const [domain, links] of Object.entries(linksByDomain)) {
      for (const link of links) {
        const result = await validateLink(link, true, repoRoot);
        results.push(result);
        
        if (!result.result.valid) {
          errorCount++;
        } else if (result.result.warning) {
          warningCount++;
        }
        
        // Add a small delay between requests to the same domain to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // Prepare summary
  const summary = {
    totalFiles: filePaths.length,
    totalLinks: allLinks.length,
    validLinks: allLinks.length - errorCount - warningCount,
    warnings: warningCount,
    errors: errorCount
  };
  
  return { results, summary };
}

module.exports = {
  extractLinks,
  checkInternalLink,
  checkExternalLink,
  findMarkdownFiles,
  validateLink,
  validateLinks
};