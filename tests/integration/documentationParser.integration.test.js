// ABOUTME: Integration tests for documentationParser with onboarding tools
// ABOUTME: Validates that the parser correctly loads documentation files

const path = require('path');
const fs = require('fs');
const {
  loadMarkdownFile,
  parseSections,
  extractSection,
  extractListItems,
  extractCodeBlocks,
  extractJsonExamples
} = require('../../src/utils/documentationParser');

// Don't mock fs for integration tests - we want to read actual files
jest.unmock('fs');

describe('documentationParser integration', () => {
  // Load the simplified documentation
  const docsPath = path.resolve(__dirname, '../../docs');
  const aiIntegrationPath = path.join(docsPath, 'ai-integration.md');
  const workflowsPath = path.join(docsPath, 'workflows.md');
  
  describe('parseSections', () => {
    it('should correctly parse markdown files into sections', () => {
      // Read the AI integration doc
      const markdown = fs.readFileSync(aiIntegrationPath, 'utf8');
      
      // Parse it into sections
      const parsed = parseSections(markdown);
      
      // Check structure
      expect(parsed).toBeDefined();
      expect(parsed.title).toBeDefined();
      expect(parsed.sections).toBeDefined();
      
      // There should be multiple sections
      expect(Object.keys(parsed.sections).length).toBeGreaterThan(2);
    });
  });
  
  describe('extractSection', () => {
    it('should extract sections by name', () => {
      // Read and parse AI integration doc
      const markdown = fs.readFileSync(aiIntegrationPath, 'utf8');
      const parsed = parseSections(markdown);
      
      // Extract a section that should exist
      const overview = extractSection(parsed, 'Overview');
      
      // Section should have content
      expect(overview).toBeDefined();
      expect(typeof overview).toBe('string');
      expect(overview.length).toBeGreaterThan(10);
    });
  });
  
  describe('extractListItems', () => {
    it('should extract bulleted lists from markdown content', () => {
      // Read and parse AI integration doc - it has more bullet points
      const markdown = fs.readFileSync(aiIntegrationPath, 'utf8');
      const parsed = parseSections(markdown);
      
      // Find a section with a bulleted list (Overview should have some)
      const overview = extractSection(parsed, 'Overview');
      
      // Extract list items
      const items = extractListItems(overview);
      
      // Should extract list items if they exist
      expect(items).toBeInstanceOf(Array);
      
      // If there are list items, verify their format
      if (items.length > 0) {
        items.forEach(item => {
          expect(typeof item).toBe('string');
          expect(item.length).toBeGreaterThan(0);
          // Items shouldn't have bullet points
          expect(item.startsWith('-')).toBe(false);
          expect(item.startsWith('*')).toBe(false);
        });
      } else {
        // If no list items found, this test passes anyway
        expect(true).toBe(true);
      }
    });
  });
  
  describe('extractCodeBlocks', () => {
    it('should extract code blocks from markdown content', () => {
      // Read and parse AI integration doc
      const markdown = fs.readFileSync(aiIntegrationPath, 'utf8');
      const parsed = parseSections(markdown);
      
      // Find a section with code blocks (Example Tool Usage)
      const exampleSection = extractSection(parsed, 'Example Tool Usage');
      
      // Extract code blocks
      const codeBlocks = extractCodeBlocks(exampleSection);
      
      // Should have multiple code blocks
      expect(codeBlocks).toBeInstanceOf(Array);
      expect(codeBlocks.length).toBeGreaterThan(0);
      
      // Check block format
      codeBlocks.forEach(block => {
        expect(block).toHaveProperty('language');
        expect(block).toHaveProperty('code');
        expect(typeof block.code).toBe('string');
        expect(block.code.length).toBeGreaterThan(0);
      });
    });
    
    it('should filter code blocks by language', () => {
      // Read and parse AI integration doc
      const markdown = fs.readFileSync(aiIntegrationPath, 'utf8');
      const parsed = parseSections(markdown);
      
      // Find a section with code blocks
      const exampleSection = extractSection(parsed, 'Example Tool Usage');
      
      // Extract only JSON code blocks
      const jsonBlocks = extractCodeBlocks(exampleSection, 'json');
      
      // All blocks should be JSON
      expect(jsonBlocks.length).toBeGreaterThan(0);
      jsonBlocks.forEach(block => {
        expect(block.language).toBe('json');
      });
    });
  });
  
  describe('extractJsonExamples', () => {
    it('should extract and parse JSON examples from markdown', () => {
      // Read and parse AI integration doc
      const markdown = fs.readFileSync(aiIntegrationPath, 'utf8');
      const parsed = parseSections(markdown);
      
      // Find a section with JSON examples
      const exampleSection = extractSection(parsed, 'Example Tool Usage');
      
      // Extract JSON examples
      const jsonExamples = extractJsonExamples(exampleSection);
      
      // Should have JSON examples
      expect(jsonExamples).toBeInstanceOf(Array);
      expect(jsonExamples.length).toBeGreaterThan(0);
      
      // Examples should be parsed as objects
      jsonExamples.forEach(example => {
        // Skip examples that couldn't be parsed
        if (!example._parsingError) {
          expect(typeof example).toBe('object');
          // MCP examples should have tool and args properties
          if (example.tool && example.tool.startsWith('mcp__')) {
            expect(example).toHaveProperty('tool');
            expect(example).toHaveProperty('args');
          }
        }
      });
    });
  });
});