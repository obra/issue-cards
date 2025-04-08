// ABOUTME: Unit tests for documentationParser utility
// ABOUTME: Tests parsing and extraction of content from AI documentation

const fs = require('fs');
const path = require('path');
const {
  parseSections,
  extractSection,
  extractListItems,
  extractCodeBlocks,
  extractJsonExamples,
  __test__: { DOCUMENTATION_INDEX }
} = require('../../src/utils/documentationParser');

// Mock fs for testing
jest.mock('fs');

describe('documentationParser', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  describe('parseSections', () => {
    it('should extract title and sections from markdown', () => {
      const markdown = `# Test Document
      
## Introduction
This is an introduction.

## Best Practices
- Practice 1
- Practice 2

## Code Examples
\`\`\`json
{ "example": true }
\`\`\`
`;

      const result = parseSections(markdown);
      
      expect(result.title).toBe('Test Document');
      expect(Object.keys(result.sections)).toHaveLength(3);
      expect(result.sections.introduction).toBeDefined();
      expect(result.sections.bestPractices).toBeDefined();
      expect(result.sections.codeExamples).toBeDefined();
    });

    it('should handle documents without a title', () => {
      const markdown = `## Section One
Content one.

## Section Two
Content two.
`;

      const result = parseSections(markdown);
      
      expect(result.title).toBe('Untitled Document');
      expect(Object.keys(result.sections)).toHaveLength(2);
    });

    it('should convert section names to camelCase', () => {
      const markdown = `# Test Document
      
## Complex Section Name 123
Content here.

## Another Section with special chars
More content.
`;

      const result = parseSections(markdown);
      
      expect(result.sections.complexSectionName123).toBeDefined();
      expect(result.sections.anotherSectionWithSpecialChars).toBeDefined();
    });
  });

  describe('extractSection', () => {
    it('should extract a specific section by name', () => {
      const parsedDoc = {
        title: 'Test Document',
        sections: {
          introduction: 'This is an introduction.',
          bestPractices: '- Practice 1\n- Practice 2'
        }
      };

      const result = extractSection(parsedDoc, 'Introduction');
      
      expect(result).toBe('This is an introduction.');
    });

    it('should return null for non-existent sections', () => {
      const parsedDoc = {
        title: 'Test Document',
        sections: {
          introduction: 'This is an introduction.'
        }
      };

      const result = extractSection(parsedDoc, 'Missing Section');
      
      expect(result).toBeNull();
    });

    it('should handle case in section names', () => {
      const parsedDoc = {
        title: 'Test Document',
        sections: {
          bestPractices: '- Practice 1\n- Practice 2'
        }
      };

      const result = extractSection(parsedDoc, 'best practices');
      
      expect(result).toBe('- Practice 1\n- Practice 2');
    });
  });

  describe('extractListItems', () => {
    it('should extract list items from markdown lists', () => {
      const markdown = `- Item 1
- Item 2
- Item 3`;

      const result = extractListItems(markdown);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('should handle different list marker styles', () => {
      const markdown = `- Item 1
* Item 2
• Item 3`;

      const result = extractListItems(markdown);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('should handle indented list items', () => {
      const markdown = `  - Item 1
    - Item 2
  - Item 3`;

      const result = extractListItems(markdown);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('should return empty array for non-list content', () => {
      const markdown = `This is not a list.
This is also not a list.`;

      const result = extractListItems(markdown);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('extractCodeBlocks', () => {
    it('should extract code blocks from markdown', () => {
      const markdown = `Some text

\`\`\`javascript
const x = 1;
\`\`\`

More text

\`\`\`json
{ "data": true }
\`\`\``;

      const result = extractCodeBlocks(markdown);
      
      expect(result).toHaveLength(2);
      expect(result[0].language).toBe('javascript');
      expect(result[0].code).toBe('const x = 1;');
      expect(result[1].language).toBe('json');
      expect(result[1].code).toBe('{ "data": true }');
    });

    it('should filter code blocks by language', () => {
      const markdown = `\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`json
{ "data": true }
\`\`\``;

      const result = extractCodeBlocks(markdown, 'json');
      
      expect(result).toHaveLength(1);
      expect(result[0].language).toBe('json');
      expect(result[0].code).toBe('{ "data": true }');
    });

    it('should handle code blocks without language specification', () => {
      const markdown = `\`\`\`
console.log("No language");
\`\`\``;

      const result = extractCodeBlocks(markdown);
      
      expect(result).toHaveLength(1);
      expect(result[0].language).toBe('');
      expect(result[0].code).toBe('console.log("No language");');
    });
  });

  describe('extractJsonExamples', () => {
    it('should extract and parse JSON from code blocks', () => {
      const markdown = `Some text

\`\`\`json
{
  "tool": "example",
  "args": {
    "param1": "value1",
    "param2": 123
  }
}
\`\`\`

\`\`\`json
[1, 2, 3]
\`\`\``;

      const result = extractJsonExamples(markdown);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        tool: 'example',
        args: {
          param1: 'value1',
          param2: 123
        }
      });
      expect(result[1]).toEqual([1, 2, 3]);
    });

    it('should handle invalid JSON', () => {
      const markdown = `\`\`\`json
{ invalid: json }
\`\`\``;

      const result = extractJsonExamples(markdown);
      
      expect(result).toHaveLength(1);
      expect(result[0]._parsingError).toBe(true);
      expect(result[0].originalCode).toBe('{ invalid: json }');
    });
  });

  describe('DOCUMENTATION_INDEX', () => {
    it('should include mappings for all documentation categories', () => {
      // Verify the structure of the documentation index
      expect(DOCUMENTATION_INDEX).toHaveProperty('roles');
      expect(DOCUMENTATION_INDEX).toHaveProperty('workflows');
      expect(DOCUMENTATION_INDEX).toHaveProperty('best-practices');
      expect(DOCUMENTATION_INDEX).toHaveProperty('tool-examples');
      
      // Verify role mappings
      expect(DOCUMENTATION_INDEX.roles).toHaveProperty('pm');
      expect(DOCUMENTATION_INDEX.roles).toHaveProperty('developer');
      expect(DOCUMENTATION_INDEX.roles).toHaveProperty('reviewer');
      
      // Verify workflow mappings
      expect(DOCUMENTATION_INDEX.workflows).toHaveProperty('create-feature');
      expect(DOCUMENTATION_INDEX.workflows).toHaveProperty('bugfix');
      expect(DOCUMENTATION_INDEX.workflows).toHaveProperty('task-management');
    });
  });
});