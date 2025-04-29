// ABOUTME: Tests for TDD task sequences documentation
// ABOUTME: Verifies content and structure of TDD sequence patterns

const fs = require('fs');
const path = require('path');

describe('TDD Task Sequences Documentation', () => {
  const tddSequencesPath = path.join(__dirname, '../../docs/ai/best-practices/tdd-task-sequences.md');
  const indexPath = path.join(__dirname, '../../docs/ai/index.md');
  const tddWorkflowPath = path.join(__dirname, '../../docs/ai/workflows/tdd-workflow.md');
  
  let tddSequencesContent;
  let indexContent;
  let tddWorkflowContent;
  
  beforeAll(() => {
    tddSequencesContent = fs.readFileSync(tddSequencesPath, 'utf8');
    indexContent = fs.readFileSync(indexPath, 'utf8');
    tddWorkflowContent = fs.readFileSync(tddWorkflowPath, 'utf8');
  });

  describe('TDD task sequences document', () => {
    it('should exist', () => {
      expect(fs.existsSync(tddSequencesPath)).toBe(true);
    });

    it('should have proper ABOUTME comments', () => {
      const lines = tddSequencesContent.split('\n');
      expect(lines[0]).toMatch(/^\/\/ ABOUTME: Guidance for creating effective TDD task sequences/);
      expect(lines[1]).toMatch(/^\/\/ ABOUTME:/);
    });

    it('should contain the basic TDD task pattern', () => {
      expect(tddSequencesContent).toMatch(/## Basic TDD Task Sequence Pattern/);
      expect(tddSequencesContent).toMatch(/1\. Test task \(RED phase\)/);
      expect(tddSequencesContent).toMatch(/2\. Implementation task \(GREEN phase\)/);
      expect(tddSequencesContent).toMatch(/3\. Refactor task \(REFACTOR phase\)/);
    });

    it('should include guidance on using tag templates', () => {
      expect(tddSequencesContent).toMatch(/## Using Tag Templates to Generate TDD Sequences/);
      expect(tddSequencesContent).toMatch(/This automatically expands to the proper TDD sequence/);
    });

    it('should include task sequence templates', () => {
      expect(tddSequencesContent).toMatch(/## Task Sequence Templates for Common Features/);
      expect(tddSequencesContent).toMatch(/### CRUD Feature Template/);
      expect(tddSequencesContent).toMatch(/### Authentication Feature Template/);
    });

    it('should include special cases for bug fixing', () => {
      expect(tddSequencesContent).toMatch(/## Special Case: Bug Fixing with TDD/);
      expect(tddSequencesContent).toMatch(/Write test that reproduces the bug/);
    });

    it('should include best practices', () => {
      expect(tddSequencesContent).toMatch(/## Best Practices for TDD Task Sequences/);
      expect(tddSequencesContent).toMatch(/Start with test tasks/);
    });

    it('should include helper sections', () => {
      expect(tddSequencesContent).toMatch(/## Helper: Converting Existing Tasks to TDD Pattern/);
      expect(tddSequencesContent).toMatch(/## Helper: Testing Level Decision Guide/);
      expect(tddSequencesContent).toMatch(/## Helper: TDD Task Name Patterns/);
    });

    it('should include decision guidance', () => {
      expect(tddSequencesContent).toMatch(/Recommended Testing Approach/);
      expect(tddSequencesContent).toMatch(/Component Type/);
    });
  });

  describe('Documentation references', () => {
    it('should be referenced in the main index', () => {
      expect(indexContent).toMatch(/\[TDD Task Sequences\]\(best-practices\/tdd-task-sequences\.md\)/);
    });

    it('should be referenced in the TDD workflow document', () => {
      expect(tddWorkflowContent).toMatch(/see \[TDD Task Sequences\]\(\.\.\/best-practices\/tdd-task-sequences\.md\)/);
    });
  });
});