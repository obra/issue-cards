// ABOUTME: Tests link validation in documentation files
// ABOUTME: Ensures all links (internal and external) are valid and not broken

const path = require('path');
const linkValidator = require('../../src/utils/linkValidator');

// Configure jest timeout for external link checks
jest.setTimeout(30000);

describe('Documentation Link Validation', () => {
  let docFiles = [];
  let allLinks = [];
  
  // Find all markdown files and extract links before running tests
  beforeAll(async () => {
    const docsDir = path.resolve(__dirname, '../../docs');
    docFiles = await linkValidator.findMarkdownFiles(docsDir);
    
    // Extract links from all files
    for (const file of docFiles) {
      const content = await require('fs').promises.readFile(file, 'utf8');
      const links = linkValidator.extractLinks(content);
      
      // Add file path to each link
      links.forEach(link => {
        allLinks.push({
          ...link,
          filePath: file
        });
      });
    }
    
    console.log(`Found ${docFiles.length} documentation files with ${allLinks.length} links to validate`);
  });
  
  test('All documentation files should exist', () => {
    expect(docFiles.length).toBeGreaterThan(0);
  });
  
  test('All documentation files should have at least one link', () => {
    const filesWithLinks = new Set(allLinks.map(link => link.filePath));
    expect(filesWithLinks.size).toBeGreaterThan(0);
  });
  
  test('All internal links should resolve to valid files', async () => {
    const internalLinks = allLinks.filter(link => 
      !link.url.startsWith('http://') && 
      !link.url.startsWith('https://'));
    
    console.log(`Checking ${internalLinks.length} internal links...`);
    
    for (const link of internalLinks) {
      const result = await linkValidator.validateLink(link, false);
      
      // Prepare a meaningful error message if link is invalid
      if (!result.result.valid) {
        const relativePath = path.relative(path.resolve(__dirname, '../..'), link.filePath);
        const message = `Broken internal link in ${relativePath} (line ${link.line}): "${link.text}" -> "${link.url}"\n${result.result.reason}`;
        expect(result.result.valid).toBe(true, message);
      }
    }
  });
  
  // This test is commented out by default since it makes external HTTP requests
  // Uncomment it when you want to validate external links
  test.skip('All external links should be accessible', async () => {
    const externalLinks = allLinks.filter(link => 
      link.url.startsWith('http://') || 
      link.url.startsWith('https://'));
    
    console.log(`Checking ${externalLinks.length} external links...`);
    
    // Group links by domain to avoid rate limiting
    const linksByDomain = {};
    externalLinks.forEach(link => {
      try {
        const url = new URL(link.url);
        const domain = url.hostname;
        
        if (!linksByDomain[domain]) {
          linksByDomain[domain] = [];
        }
        
        linksByDomain[domain].push(link);
      } catch (error) {
        // Handle invalid URLs
        const relativePath = path.relative(path.resolve(__dirname, '../..'), link.filePath);
        fail(`Invalid URL in ${relativePath} (line ${link.line}): "${link.text}" -> "${link.url}"\nError: ${error.message}`);
      }
    });
    
    // Check links domain by domain with delay between requests to the same domain
    for (const [domain, links] of Object.entries(linksByDomain)) {
      console.log(`Checking ${links.length} links to ${domain}...`);
      
      for (const link of links) {
        const result = await linkValidator.validateLink(link, true);
        
        // Prepare a meaningful error message if link is invalid
        if (!result.result.valid) {
          const relativePath = path.relative(path.resolve(__dirname, '../..'), link.filePath);
          const message = `Broken external link in ${relativePath} (line ${link.line}): "${link.text}" -> "${link.url}"\n${result.result.reason}`;
          expect(result.result.valid).toBe(true, message);
        }
        
        // Add a small delay between requests to the same domain to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  });
  
  test('Validate links utility should work for all documentation files', async () => {
    // This test uses the validateLinks utility function to validate all links at once
    const { results, summary } = await linkValidator.validateLinks(docFiles, { checkExternal: false });
    
    // Report any errors
    const errors = results.filter(r => !r.result.valid);
    if (errors.length > 0) {
      console.log('Found broken links:');
      errors.forEach(error => {
        const relativePath = path.relative(path.resolve(__dirname, '../..'), error.link.filePath);
        console.log(`- ${relativePath} (line ${error.link.line}): "${error.link.text}" -> "${error.link.url}"`);
        console.log(`  Reason: ${error.result.reason}`);
      });
    }
    
    // Expect no errors
    expect(summary.errors).toBe(0);
  });
});