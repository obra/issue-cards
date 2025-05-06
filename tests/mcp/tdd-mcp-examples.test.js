// ABOUTME: Tests for TDD MCP examples in AI integration docs
// ABOUTME: Verifies content related to TDD examples

const fs = require('fs');
const path = require('path');

describe('TDD MCP Examples Documentation', () => {
  const aiIntegrationPath = path.join(__dirname, '../../docs/ai-integration.md');
  const workflowsPath = path.join(__dirname, '../../docs/workflows.md');
  
  let aiIntegrationContent;
  let workflowsContent;
  
  beforeAll(() => {
    // Only read files that exist in our simplified structure
    aiIntegrationContent = fs.readFileSync(aiIntegrationPath, 'utf8');
    workflowsContent = fs.readFileSync(workflowsPath, 'utf8');
  });

  // Simplify tests to check that AI integration contains MCP tool examples
  describe('AI Integration document', () => {
    it('should exist', () => {
      expect(fs.existsSync(aiIntegrationPath)).toBe(true);
    });

    it('should have a proper title', () => {
      expect(aiIntegrationContent).toMatch(/# AI Integration Guide/);
    });

    it('should include MCP tool examples', () => {
      expect(aiIntegrationContent).toMatch(/Example Tool Usage/);
      expect(aiIntegrationContent).toMatch(/getCurrentTask/);
      expect(aiIntegrationContent).toMatch(/completeTask/);
      expect(aiIntegrationContent).toMatch(/addNote/);
      expect(aiIntegrationContent).toMatch(/addQuestion/);
      expect(aiIntegrationContent).toMatch(/logFailure/);
      expect(aiIntegrationContent).toMatch(/addTask/);
    });

    it('should include JSON tool examples', () => {
      expect(aiIntegrationContent).toMatch(/"tool": "mcp__/);
      expect(aiIntegrationContent).toMatch(/"args": {/);
    });
  });

  describe('Workflows document', () => {
    it('should include TDD workflow', () => {
      expect(workflowsContent).toMatch(/Test-Driven Development Workflow/);
    });

    it('should include tag templates for TDD', () => {
      expect(workflowsContent).toMatch(/\+unit-test/);
    });
  });
});