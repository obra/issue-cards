// ABOUTME: Tests for developer TDD workflow documentation
// ABOUTME: Verifies content and structure of developer TDD guidance

const fs = require('fs');
const path = require('path');

describe('Developer TDD Documentation', () => {
  const developerDocPath = path.join(__dirname, '../../docs/ai/roles/developer.md');
  
  let developerContent;
  
  beforeAll(() => {
    developerContent = fs.readFileSync(developerDocPath, 'utf8');
  });

  describe('Developer documentation', () => {
    it('should exist', () => {
      expect(fs.existsSync(developerDocPath)).toBe(true);
    });

    it('should contain a dedicated TDD workflow section', () => {
      expect(developerContent).toMatch(/## Test-Driven Development Workflow/);
      expect(developerContent).toMatch(/Test-Driven Development \(TDD\) is a core development methodology/);
    });

    it('should explain the TDD cycle', () => {
      expect(developerContent).toMatch(/### The TDD Cycle/);
      expect(developerContent).toMatch(/1\. \*\*RED\*\*: Write failing tests/);
      expect(developerContent).toMatch(/2\. \*\*GREEN\*\*: Implement the minimum code/);
      expect(developerContent).toMatch(/3\. \*\*REFACTOR\*\*: Improve the code/);
    });

    it('should describe all test tag templates', () => {
      expect(developerContent).toMatch(/### TDD Tag Templates/);
      expect(developerContent).toMatch(/\*\*\+unit-test\*\*: For component or function-level testing/);
      expect(developerContent).toMatch(/\*\*\+integration-test\*\*: For testing component interactions/);
      expect(developerContent).toMatch(/\*\*\+e2e-test\*\*: For testing full user flows/);
    });

    it('should include practical implementation guidance', () => {
      expect(developerContent).toMatch(/### Implementing TDD in Practice/);
      expect(developerContent).toMatch(/Start with clear test requirements/);
      expect(developerContent).toMatch(/Create small, focused tests/);
      expect(developerContent).toMatch(/Implement minimal code to pass tests/);
      expect(developerContent).toMatch(/Document refactoring steps/);
    });

    it('should include example mcp tool usage', () => {
      expect(developerContent).toMatch(/"tool": "mcp__addNote"/);
      expect(developerContent).toMatch(/"section": "Test implementation"/);
      expect(developerContent).toMatch(/"section": "Implementation notes"/);
      expect(developerContent).toMatch(/"section": "Refactoring"/);
      expect(developerContent).toMatch(/"tool": "mcp__logFailure"/);
    });

    it('should reference other TDD documentation', () => {
      expect(developerContent).toMatch(/see \[TDD Task Sequences\]\(\.\.\/best-practices\/tdd-task-sequences\.md\)/);
      expect(developerContent).toMatch(/see the \[TDD Workflow\]\(\.\.\/workflows\/tdd-workflow\.md\)/);
    });
  });
});