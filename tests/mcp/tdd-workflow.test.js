// ABOUTME: Tests for TDD workflow documentation
// ABOUTME: Verifies content and accessibility of TDD documentation

const fs = require('fs');
const path = require('path');
const { extractSection } = require('../../src/utils/documentationParser');

describe('TDD Workflow Documentation', () => {
  const tddWorkflowPath = path.join(__dirname, '../../docs/ai/workflows/tdd-workflow.md');
  const developerDocPath = path.join(__dirname, '../../docs/ai/roles/developer.md');
  const indexPath = path.join(__dirname, '../../docs/ai/index.md');
  
  let tddContent;
  let developerContent;
  let indexContent;
  
  beforeAll(() => {
    tddContent = fs.readFileSync(tddWorkflowPath, 'utf8');
    developerContent = fs.readFileSync(developerDocPath, 'utf8');
    indexContent = fs.readFileSync(indexPath, 'utf8');
  });

  describe('TDD workflow document', () => {
    it('should exist', () => {
      expect(fs.existsSync(tddWorkflowPath)).toBe(true);
    });

    it('should have proper ABOUTME comments', () => {
      const lines = tddContent.split('\n');
      expect(lines[0]).toMatch(/^\/\/ ABOUTME: AI-specific workflow documentation/);
      expect(lines[1]).toMatch(/^\/\/ ABOUTME:/);
    });

    it('should contain the TDD cycle explanation', () => {
      expect(tddContent).toMatch(/## The TDD Cycle/);
      expect(tddContent).toMatch(/Red.*Write a failing test/);
      expect(tddContent).toMatch(/Green.*Write the minimum code/);
      expect(tddContent).toMatch(/Refactor.*Improve the code/);
    });

    it('should include step-by-step instructions', () => {
      expect(tddContent).toMatch(/## Steps/);
      expect(tddContent).toMatch(/1\. Start with your current task/);
      expect(tddContent).toMatch(/2\. Write failing tests \(Red phase\)/);
      expect(tddContent).toMatch(/3\. Implement minimum code/);
      expect(tddContent).toMatch(/4\. Refactor/);
    });

    it('should include examples with mcp tool usage', () => {
      expect(tddContent).toMatch(/"tool": "mcp__getCurrentTask"/);
      expect(tddContent).toMatch(/"tool": "mcp__addNote"/);
      expect(tddContent).toMatch(/"tool": "mcp__logFailure"/);
      expect(tddContent).toMatch(/"tool": "mcp__completeTask"/);
    });

    it('should explain tag templates for TDD', () => {
      expect(tddContent).toMatch(/## Using Tag Templates for TDD/);
      expect(tddContent).toMatch(/\+unit-test Template/);
      expect(tddContent).toMatch(/\+e2e-test Template/);
    });

    it('should include best practices', () => {
      expect(tddContent).toMatch(/## Best Practices for TDD/);
      expect(tddContent).toMatch(/Writing Effective Tests/);
      expect(tddContent).toMatch(/Successful Implementation/);
    });
  });

  describe('Developer documentation reference', () => {
    it('should include a reference to the TDD workflow', () => {
      expect(developerContent).toMatch(/\[TDD Workflow\]\(\.\.\/workflows\/tdd-workflow\.md\)/);
    });
  });

  describe('Index documentation reference', () => {
    it('should include a reference to the TDD workflow', () => {
      expect(indexContent).toMatch(/\[TDD Workflow\]\(workflows\/tdd-workflow\.md\)/);
    });
  });
});