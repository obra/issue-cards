// ABOUTME: Tests for TDD MCP examples documentation
// ABOUTME: Verifies content and references to TDD command examples

const fs = require('fs');
const path = require('path');

describe('TDD MCP Examples Documentation', () => {
  const tddExamplesPath = path.join(__dirname, '../../docs/reference/tdd-mcp-examples.md');
  const indexPath = path.join(__dirname, '../../docs/reference/index.md');
  const tddWorkflowPath = path.join(__dirname, '../../docs/ai/workflows/tdd-workflow.md');
  const developerDocPath = path.join(__dirname, '../../docs/ai/roles/developer.md');
  
  let tddExamplesContent;
  let indexContent;
  let tddWorkflowContent;
  let developerDocContent;
  
  beforeAll(() => {
    tddExamplesContent = fs.readFileSync(tddExamplesPath, 'utf8');
    indexContent = fs.readFileSync(indexPath, 'utf8');
    tddWorkflowContent = fs.readFileSync(tddWorkflowPath, 'utf8');
    developerDocContent = fs.readFileSync(developerDocPath, 'utf8');
  });

  describe('TDD MCP examples document', () => {
    it('should exist', () => {
      expect(fs.existsSync(tddExamplesPath)).toBe(true);
    });

    it('should have a proper title', () => {
      expect(tddExamplesContent).toMatch(/# TDD Workflow MCP Examples/);
    });

    it('should include example for creating a TDD-focused issue', () => {
      expect(tddExamplesContent).toMatch(/## Creating a TDD-Focused Issue/);
      expect(tddExamplesContent).toMatch(/mcp__createIssue/);
      expect(tddExamplesContent).toMatch(/\+unit-test/);
      expect(tddExamplesContent).toMatch(/\+integration-test/);
      expect(tddExamplesContent).toMatch(/\+e2e-test/);
    });

    it('should include a complete TDD workflow example', () => {
      expect(tddExamplesContent).toMatch(/## Complete TDD Workflow Example/);
      expect(tddExamplesContent).toMatch(/### 1\. Get the Current Task/);
      expect(tddExamplesContent).toMatch(/### 2\. Document Your Testing Approach/);
      expect(tddExamplesContent).toMatch(/### 3\. RED Phase/);
      expect(tddExamplesContent).toMatch(/### 4\. GREEN Phase/);
      expect(tddExamplesContent).toMatch(/### 5\. REFACTOR Phase/);
    });

    it('should include different testing type examples', () => {
      expect(tddExamplesContent).toMatch(/## Integration Testing Workflow Example/);
      expect(tddExamplesContent).toMatch(/## End-to-End Testing Workflow Example/);
      expect(tddExamplesContent).toMatch(/### Testing Edge Cases/);
      expect(tddExamplesContent).toMatch(/### Testing Security Requirements/);
    });

    it('should include best practices', () => {
      expect(tddExamplesContent).toMatch(/## TDD Best Practices for issue-cards/);
      expect(tddExamplesContent).toMatch(/\*\*Use Appropriate Tag Templates\*\*/);
      expect(tddExamplesContent).toMatch(/\*\*Document Each TDD Phase\*\*/);
      expect(tddExamplesContent).toMatch(/\*\*Record Failed Approaches\*\*/);
    });

    it('should include MCP command examples for each step', () => {
      expect(tddExamplesContent).toMatch(/"tool": "mcp__getCurrentTask"/);
      expect(tddExamplesContent).toMatch(/"tool": "mcp__addNote"/);
      expect(tddExamplesContent).toMatch(/"tool": "mcp__logFailure"/);
      expect(tddExamplesContent).toMatch(/"tool": "mcp__completeTask"/);
    });

    it('should include specific sections for RED, GREEN, REFACTOR phases', () => {
      expect(tddExamplesContent).toMatch(/RED Phase:/);
      expect(tddExamplesContent).toMatch(/GREEN Phase:/);
      expect(tddExamplesContent).toMatch(/REFACTOR Phase:/);
    });
  });

  describe('Documentation references', () => {
    it('should be referenced in the reference index', () => {
      expect(indexContent).toMatch(/\[TDD MCP Examples\]\(tdd-mcp-examples\.md\)/);
    });

    it('should be referenced in the TDD workflow document', () => {
      expect(tddWorkflowContent).toMatch(/\[TDD MCP Examples\]\(\.\.\/\.\.\/reference\/tdd-mcp-examples\.md\)/);
    });

    it('should be referenced in the developer documentation', () => {
      expect(developerDocContent).toMatch(/\[TDD MCP Examples\]\(\.\.\/\.\.\/reference\/tdd-mcp-examples\.md\)/);
    });
  });
});