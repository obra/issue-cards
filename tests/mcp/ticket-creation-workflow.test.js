// ABOUTME: Tests for ticket creation workflow documentation
// ABOUTME: Verifies content and structure of MCP command sequences for ticket creation

const fs = require('fs');
const path = require('path');

describe('Ticket Creation Workflow Documentation', () => {
  const ticketCreationWorkflowPath = path.join(__dirname, '../../docs/ai/workflows/ticket-creation-workflow.md');
  const indexPath = path.join(__dirname, '../../docs/ai/index.md');
  const pmDocPath = path.join(__dirname, '../../docs/ai/roles/project-manager.md');
  
  let ticketCreationWorkflowContent;
  let indexContent;
  let pmDocContent;
  
  beforeAll(() => {
    ticketCreationWorkflowContent = fs.readFileSync(ticketCreationWorkflowPath, 'utf8');
    indexContent = fs.readFileSync(indexPath, 'utf8');
    pmDocContent = fs.readFileSync(pmDocPath, 'utf8');
  });

  describe('Ticket creation workflow document', () => {
    it('should exist', () => {
      expect(fs.existsSync(ticketCreationWorkflowPath)).toBe(true);
    });

    it('should have proper ABOUTME comments', () => {
      const lines = ticketCreationWorkflowContent.split('\n');
      expect(lines[0]).toMatch(/^\/\/ ABOUTME: Comprehensive MCP command sequences/);
      expect(lines[1]).toMatch(/^\/\/ ABOUTME:/);
    });

    it('should contain a ticket creation process flow', () => {
      expect(ticketCreationWorkflowContent).toMatch(/## Ticket Creation Process Flow/);
      expect(ticketCreationWorkflowContent).toMatch(/1\. \*\*Preparation\*\*:/);
      expect(ticketCreationWorkflowContent).toMatch(/2\. \*\*Issue Creation\*\*:/);
    });

    it('should include comprehensive command sequences', () => {
      expect(ticketCreationWorkflowContent).toMatch(/## Complete MCP Command Sequences/);
      expect(ticketCreationWorkflowContent).toMatch(/### 1\. Basic Ticket Creation Sequence/);
      expect(ticketCreationWorkflowContent).toMatch(/### 2\. Comprehensive Ticket Creation with TDD/);
      expect(ticketCreationWorkflowContent).toMatch(/### 3\. Bug Ticket Creation Sequence/);
    });

    it('should include task sequences', () => {
      expect(ticketCreationWorkflowContent).toMatch(/### 4\. Task Addition and Refinement Sequence/);
      expect(ticketCreationWorkflowContent).toMatch(/### 5\. Task Implementation and Progress Tracking Sequence/);
      expect(ticketCreationWorkflowContent).toMatch(/### 6\. Issue Completion Sequence/);
    });

    it('should include specialized ticket patterns', () => {
      expect(ticketCreationWorkflowContent).toMatch(/## Specialized Ticket Creation Patterns/);
      expect(ticketCreationWorkflowContent).toMatch(/### Test-Driven Development Ticket/);
      expect(ticketCreationWorkflowContent).toMatch(/### Refactoring Ticket/);
    });

    it('should include best practices', () => {
      expect(ticketCreationWorkflowContent).toMatch(/## Best Practices for Ticket Creation/);
      expect(ticketCreationWorkflowContent).toMatch(/### Structuring Issues/);
      expect(ticketCreationWorkflowContent).toMatch(/### Using Tags Effectively/);
      expect(ticketCreationWorkflowContent).toMatch(/### Documentation Within Issues/);
    });

    it('should include command sequence templates', () => {
      expect(ticketCreationWorkflowContent).toMatch(/## Command Sequence Templates/);
      expect(ticketCreationWorkflowContent).toMatch(/### New Feature Development/);
      expect(ticketCreationWorkflowContent).toMatch(/### Bug Fix/);
    });

    it('should include a complete ticket lifecycle example', () => {
      expect(ticketCreationWorkflowContent).toMatch(/## Complete Ticket Lifecycle Example/);
      expect(ticketCreationWorkflowContent).toMatch(/1\. \*\*Create the issue\*\*:/);
      expect(ticketCreationWorkflowContent).toMatch(/"tool": "mcp__createIssue"/);
    });
  });

  describe('Documentation references', () => {
    it('should be referenced in the main index', () => {
      expect(indexContent).toMatch(/\[Ticket Creation Workflow\]\(workflows\/ticket-creation-workflow\.md\)/);
    });

    it('should be referenced in the project manager documentation', () => {
      expect(pmDocContent).toMatch(/\[Ticket Creation Workflow\]\(\.\.\/workflows\/ticket-creation-workflow\.md\)/);
    });
  });
});