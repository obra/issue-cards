// ABOUTME: Tests for TDD task examples documentation
// ABOUTME: Verifies content and structure of TDD task examples

const fs = require('fs');
const path = require('path');

describe('TDD Task Examples Documentation', () => {
  const tddExamplesPath = path.join(__dirname, '../../docs/ai/tool-examples/tdd-task-examples.md');
  const indexPath = path.join(__dirname, '../../docs/ai/index.md');
  const tddWorkflowPath = path.join(__dirname, '../../docs/ai/workflows/tdd-workflow.md');
  
  let tddExamplesContent;
  let indexContent;
  let tddWorkflowContent;
  
  beforeAll(() => {
    tddExamplesContent = fs.readFileSync(tddExamplesPath, 'utf8');
    indexContent = fs.readFileSync(indexPath, 'utf8');
    tddWorkflowContent = fs.readFileSync(tddWorkflowPath, 'utf8');
  });

  describe('TDD task examples document', () => {
    it('should exist', () => {
      expect(fs.existsSync(tddExamplesPath)).toBe(true);
    });

    it('should have proper ABOUTME comments', () => {
      const lines = tddExamplesContent.split('\n');
      expect(lines[0]).toMatch(/^\/\/ ABOUTME: Examples of TDD task structures/);
      expect(lines[1]).toMatch(/^\/\/ ABOUTME:/);
    });

    it('should contain basic TDD task patterns', () => {
      expect(tddExamplesContent).toMatch(/## Basic TDD Task Patterns/);
      expect(tddExamplesContent).toMatch(/### Component-Level Unit Testing/);
      expect(tddExamplesContent).toMatch(/### End-to-End Testing/);
      expect(tddExamplesContent).toMatch(/### Combined Testing Approaches/);
    });

    it('should include real-world examples', () => {
      expect(tddExamplesContent).toMatch(/## Real-World TDD Task Examples/);
      expect(tddExamplesContent).toMatch(/### Frontend Component Implementation/);
      expect(tddExamplesContent).toMatch(/### API Endpoint Development/);
      expect(tddExamplesContent).toMatch(/### Full User Flow Implementation/);
    });

    it('should include different application types', () => {
      expect(tddExamplesContent).toMatch(/## TDD in Different Application Types/);
      expect(tddExamplesContent).toMatch(/### Backend Service Implementation/);
      expect(tddExamplesContent).toMatch(/### Frontend Component Library/);
      expect(tddExamplesContent).toMatch(/### Database Schema Changes/);
    });

    it('should show complete TDD cycle examples', () => {
      expect(tddExamplesContent).toMatch(/## Breaking Down TDD Cycles/);
      expect(tddExamplesContent).toMatch(/#### Cycle 1:/);
      expect(tddExamplesContent).toMatch(/1\. \*\*Red\*\*:/);
      expect(tddExamplesContent).toMatch(/2\. \*\*Green\*\*:/);
      expect(tddExamplesContent).toMatch(/3\. \*\*Refactor\*\*:/);
    });

    it('should include task formatting examples', () => {
      expect(tddExamplesContent).toMatch(/### 3. Consistent Task Naming/);
      expect(tddExamplesContent).toMatch(/Pattern for consistent task naming:/);
    });

    it('should demonstrate mcp tool usage for TDD', () => {
      expect(tddExamplesContent).toMatch(/"tool": "mcp__addNote"/);
      expect(tddExamplesContent).toMatch(/"tool": "mcp__completeTask"/);
      expect(tddExamplesContent).toMatch(/"tool": "mcp__createIssue"/);
      expect(tddExamplesContent).toMatch(/"tool": "mcp__addTask"/);
    });
  });

  describe('Documentation references', () => {
    it('should be referenced in the main index', () => {
      expect(indexContent).toMatch(/\[TDD Task Examples\]\(tool-examples\/tdd-task-examples\.md\)/);
    });

    it('should be referenced in the TDD workflow document', () => {
      expect(tddWorkflowContent).toMatch(/see \[TDD Task Examples\]\(\.\.\/tool-examples\/tdd-task-examples\.md\)/);
    });
  });
});