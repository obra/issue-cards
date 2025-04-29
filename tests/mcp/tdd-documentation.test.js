// ABOUTME: Tests for TDD workflow documentation
// ABOUTME: Verifies TDD documentation, examples, and tag templates

const fs = require('fs');
const path = require('path');

describe('TDD Workflow Documentation', () => {
  describe('TDD Workflow Guide', () => {
    const tddWorkflowPath = path.join(__dirname, '../../docs/ai/workflows/tdd-workflow.md');
    let tddWorkflowContent;
    
    beforeAll(() => {
      tddWorkflowContent = fs.existsSync(tddWorkflowPath) ? 
        fs.readFileSync(tddWorkflowPath, 'utf8') : '';
    });
    
    it('should have a TDD workflow documentation file', () => {
      expect(fs.existsSync(tddWorkflowPath)).toBe(true);
    });
    
    it('should explain the Red-Green-Refactor cycle', () => {
      expect(tddWorkflowContent).toContain('Red');
      expect(tddWorkflowContent).toContain('Green');
      expect(tddWorkflowContent).toContain('Refactor');
    });
    
    it('should provide step-by-step implementation guidance', () => {
      expect(tddWorkflowContent).toContain('## Steps');
      expect(tddWorkflowContent).toContain('1.');
      expect(tddWorkflowContent).toContain('2.');
      expect(tddWorkflowContent).toContain('3.');
    });
    
    it('should reference MCP commands', () => {
      expect(tddWorkflowContent).toContain('mcp__');
      expect(tddWorkflowContent).toContain('mcp__getCurrentTask');
      expect(tddWorkflowContent).toContain('mcp__addNote');
      expect(tddWorkflowContent).toContain('mcp__completeTask');
    });
    
    it('should include best practices', () => {
      expect(tddWorkflowContent).toContain('## Best Practices');
    });
  });
  
  describe('TDD Task Examples', () => {
    const tddExamplesPath = path.join(__dirname, '../../docs/ai/tool-examples/tdd-task-examples.md');
    let tddExamplesContent;
    
    beforeAll(() => {
      tddExamplesContent = fs.existsSync(tddExamplesPath) ? 
        fs.readFileSync(tddExamplesPath, 'utf8') : '';
    });
    
    it('should have a TDD task examples file', () => {
      expect(fs.existsSync(tddExamplesPath)).toBe(true);
    });
    
    it('should include real-world examples', () => {
      expect(tddExamplesContent).toContain('## Breaking Down TDD Cycles');
      expect(tddExamplesContent).toContain('Example');
    });
    
    it('should include TDD cycle phases in examples', () => {
      // The pattern might be different, but the document should mention all three phases
      expect(tddExamplesContent).toContain('RED');
      expect(tddExamplesContent.toLowerCase()).toContain('green');
      expect(tddExamplesContent).toContain('REFACTOR');
    });
    
    it('should include examples for different testing types', () => {
      expect(tddExamplesContent).toContain('unit test');
      expect(tddExamplesContent).toContain('integration test');
      expect(tddExamplesContent).toContain('e2e test');
    });
  });
  
  describe('TDD Task Sequences', () => {
    const tddSequencesPath = path.join(__dirname, '../../docs/ai/best-practices/tdd-task-sequences.md');
    let tddSequencesContent;
    
    beforeAll(() => {
      tddSequencesContent = fs.existsSync(tddSequencesPath) ? 
        fs.readFileSync(tddSequencesPath, 'utf8') : '';
    });
    
    it('should have a TDD task sequences file', () => {
      expect(fs.existsSync(tddSequencesPath)).toBe(true);
    });
    
    it('should define the basic TDD task sequence pattern', () => {
      expect(tddSequencesContent).toContain('## Basic TDD Task Sequence Pattern');
      expect(tddSequencesContent).toContain('RED phase');
      expect(tddSequencesContent).toContain('GREEN phase');
      expect(tddSequencesContent).toContain('REFACTOR phase');
    });
    
    it('should include task sequence examples', () => {
      expect(tddSequencesContent).toContain('TDD Sequences');
    });
  });
  
  describe('TDD MCP Examples', () => {
    const tddMcpExamplesPath = path.join(__dirname, '../../docs/reference/tdd-mcp-examples.md');
    let tddMcpExamplesContent;
    
    beforeAll(() => {
      tddMcpExamplesContent = fs.existsSync(tddMcpExamplesPath) ? 
        fs.readFileSync(tddMcpExamplesPath, 'utf8') : '';
    });
    
    it('should have a TDD MCP examples file', () => {
      expect(fs.existsSync(tddMcpExamplesPath)).toBe(true);
    });
    
    it('should include examples of MCP commands for TDD workflow', () => {
      expect(tddMcpExamplesContent).toContain('## Complete TDD Workflow Example');
      expect(tddMcpExamplesContent).toContain('"tool": "mcp__getCurrentTask"');
      expect(tddMcpExamplesContent).toContain('"tool": "mcp__addNote"');
      expect(tddMcpExamplesContent).toContain('"tool": "mcp__completeTask"');
    });
    
    it('should include examples for different test types', () => {
      // Check for content about different test types
      expect(tddMcpExamplesContent.toLowerCase()).toContain('unit-test');
      expect(tddMcpExamplesContent.toLowerCase()).toContain('integration-test');
      expect(tddMcpExamplesContent.toLowerCase()).toContain('e2e-test');
    });
  });
  
  describe('Tag Templates', () => {
    const unitTestPath = path.join(__dirname, '../../templates/tag/unit-test.md');
    const integrationTestPath = path.join(__dirname, '../../templates/tag/integration-test.md');
    const e2eTestPath = path.join(__dirname, '../../templates/tag/e2e-test.md');
    
    let unitTestContent, integrationTestContent, e2eTestContent;
    
    beforeAll(() => {
      unitTestContent = fs.existsSync(unitTestPath) ? 
        fs.readFileSync(unitTestPath, 'utf8') : '';
      
      integrationTestContent = fs.existsSync(integrationTestPath) ? 
        fs.readFileSync(integrationTestPath, 'utf8') : '';
      
      e2eTestContent = fs.existsSync(e2eTestPath) ? 
        fs.readFileSync(e2eTestPath, 'utf8') : '';
    });
    
    it('should have unit test tag template', () => {
      expect(fs.existsSync(unitTestPath)).toBe(true);
    });
    
    it('should have integration test tag template', () => {
      expect(fs.existsSync(integrationTestPath)).toBe(true);
    });
    
    it('should have e2e test tag template', () => {
      expect(fs.existsSync(e2eTestPath)).toBe(true);
    });
    
    it('should include TDD guidance in unit test template', () => {
      expect(unitTestContent).toContain('Test-Driven Development');
      expect(unitTestContent).toContain('RED');
      expect(unitTestContent).toContain('GREEN');
      expect(unitTestContent).toContain('REFACTOR');
    });
    
    it('should include TDD guidance in integration test template', () => {
      expect(integrationTestContent).toContain('Test-Driven Development');
      expect(integrationTestContent).toContain('RED');
      expect(integrationTestContent).toContain('GREEN');
      expect(integrationTestContent).toContain('REFACTOR');
    });
    
    it('should include TDD guidance in e2e test template', () => {
      expect(e2eTestContent).toContain('Test-Driven Development');
      expect(e2eTestContent).toContain('RED');
      expect(e2eTestContent).toContain('GREEN');
      expect(e2eTestContent).toContain('REFACTOR');
    });
  });
  
  describe('Developer Role Documentation', () => {
    const developerDocPath = path.join(__dirname, '../../docs/ai/roles/developer.md');
    let developerDocContent;
    
    beforeAll(() => {
      developerDocContent = fs.existsSync(developerDocPath) ? 
        fs.readFileSync(developerDocPath, 'utf8') : '';
    });
    
    it('should have developer role documentation', () => {
      expect(fs.existsSync(developerDocPath)).toBe(true);
    });
    
    it('should include TDD workflow section', () => {
      expect(developerDocContent).toContain('## Test-Driven Development Workflow');
    });
    
    it('should mention test-driven development', () => {
      expect(developerDocContent.toLowerCase()).toContain('test-driven development');
      expect(developerDocContent.toLowerCase()).toContain('tdd');
    });
    
    it('should reference tag templates for testing', () => {
      expect(developerDocContent).toContain('unit-test');
      expect(developerDocContent).toContain('integration-test');
      expect(developerDocContent).toContain('e2e-test');
    });
  });
});