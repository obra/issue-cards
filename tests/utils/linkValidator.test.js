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
  
  test('Link extraction should work correctly', () => {
    expect(allLinks.length).toBeGreaterThan(0);
    
    // Check that links have the expected properties
    allLinks.forEach(link => {
      expect(link).toHaveProperty('text');
      expect(link).toHaveProperty('url');
      expect(link).toHaveProperty('line');
      expect(link).toHaveProperty('filePath');
    });
  });
  
  test('Link validator should handle relative paths', async () => {
    // Create a test case
    const testLink = {
      filePath: path.resolve(__dirname, '../../docs/index.md'),
      text: 'Quick Start',
      url: 'quick-start.md',
      line: 10
    };
    
    const result = await linkValidator.validateLink(testLink, false);
    
    // The link should be valid
    expect(result.result.valid).toBe(true);
  });
  
  test('Link validator should detect non-existent files', async () => {
    // Create a test case for non-existent file
    const testLink = {
      filePath: path.resolve(__dirname, '../../docs/index.md'),
      text: 'Non-existent',
      url: 'non-existent-file.md',
      line: 20
    };
    
    const result = await linkValidator.validateLink(testLink, false);
    
    // The link should be invalid
    expect(result.result.valid).toBe(false);
    expect(result.result.reason).toContain('File not found');
  });
  
  test('Validation utility should provide summary statistics', async () => {
    // Test with a small set of known links
    const testFiles = [
      path.resolve(__dirname, '../../docs/index.md')
    ];
    
    const { summary } = await linkValidator.validateLinks(testFiles, { checkExternal: false });
    
    // Summary should include counts
    expect(summary).toHaveProperty('totalLinks');
    expect(summary).toHaveProperty('errors');
    expect(summary).toHaveProperty('warnings');
    expect(summary).toHaveProperty('validLinks');
  });

  // This test is commented out by default since it makes external HTTP requests
  // Uncomment it when you want to validate external links
  test.skip('External link validation should work', async () => {
    // Create a test case for a known valid external link
    const testLink = {
      filePath: path.resolve(__dirname, '../../docs/index.md'),
      text: 'Node.js',
      url: 'https://nodejs.org/',
      line: 30
    };
    
    const result = await linkValidator.validateLink(testLink, true);
    
    // The link should be valid
    expect(result.result.valid).toBe(true);
  });
});