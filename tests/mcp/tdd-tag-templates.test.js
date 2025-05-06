// ABOUTME: Tests for TDD-specific tag templates
// ABOUTME: Verifies content and structure of TDD tag templates

const fs = require('fs');
const path = require('path');

describe.skip('TDD Tag Templates', () => {
  const unitTestPath = path.join(__dirname, '../../templates/tag/unit-test.md');
  const e2eTestPath = path.join(__dirname, '../../templates/tag/e2e-test.md');
  const integrationTestPath = path.join(__dirname, '../../templates/tag/integration-test.md');
  const tddWorkflowPath = path.join(__dirname, '../../docs/ai/workflows/tdd-workflow.md');
  const tddExamplesPath = path.join(__dirname, '../../docs/ai/tool-examples/tdd-task-examples.md');
  
  let unitTestContent;
  let e2eTestContent;
  let integrationTestContent;
  let tddWorkflowContent;
  let tddExamplesContent;
  
  beforeAll(() => {
    unitTestContent = fs.readFileSync(unitTestPath, 'utf8');
    e2eTestContent = fs.readFileSync(e2eTestPath, 'utf8');
    integrationTestContent = fs.readFileSync(integrationTestPath, 'utf8');
    tddWorkflowContent = fs.readFileSync(tddWorkflowPath, 'utf8');
    tddExamplesContent = fs.readFileSync(tddExamplesPath, 'utf8');
  });

  describe('Unit Test Template', () => {
    it('should exist', () => {
      expect(fs.existsSync(unitTestPath)).toBe(true);
    });

    it('should contain Red-Green-Refactor guidance', () => {
      expect(unitTestContent).toMatch(/RED phase/);
      expect(unitTestContent).toMatch(/GREEN phase/);
      expect(unitTestContent).toMatch(/REFACTOR phase/);
    });

    it('should include specific guidance for each phase', () => {
      expect(unitTestContent).toMatch(/Focus on behavior, not implementation details/);
      expect(unitTestContent).toMatch(/Implement minimal code to pass tests/);
      expect(unitTestContent).toMatch(/Improve code structure and readability/);
    });

    it('should preserve the core template structure', () => {
      expect(unitTestContent).toMatch(/# unit-test/);
      expect(unitTestContent).toMatch(/\[ACTUAL TASK GOES HERE\]/);
      expect(unitTestContent).toMatch(/Make sure test coverage meets project requirements/);
    });
  });

  describe('E2E Test Template', () => {
    it('should exist', () => {
      expect(fs.existsSync(e2eTestPath)).toBe(true);
    });

    it('should contain TDD principles for E2E testing', () => {
      expect(e2eTestContent).toMatch(/RED phase/);
      expect(e2eTestContent).toMatch(/GREEN phase/);
      expect(e2eTestContent).toMatch(/REFACTOR phase/);
    });

    it('should include user-focused guidance', () => {
      expect(e2eTestContent).toMatch(/Focus on user journeys/);
      expect(e2eTestContent).toMatch(/Test from the user's perspective/);
      expect(e2eTestContent).toMatch(/Verify the feature works in the full application context/);
    });

    it('should preserve the core template structure', () => {
      expect(e2eTestContent).toMatch(/# e2e-test/);
      expect(e2eTestContent).toMatch(/\[ACTUAL TASK GOES HERE\]/);
    });
  });

  describe('Integration Test Template', () => {
    it('should exist', () => {
      expect(fs.existsSync(integrationTestPath)).toBe(true);
    });

    it('should contain TDD principles for integration testing', () => {
      expect(integrationTestContent).toMatch(/RED phase/);
      expect(integrationTestContent).toMatch(/GREEN phase/);
      expect(integrationTestContent).toMatch(/REFACTOR phase/);
    });

    it('should focus on component interactions', () => {
      expect(integrationTestContent).toMatch(/Focus on interfaces between components/);
      expect(integrationTestContent).toMatch(/Test data flow across component boundaries/);
      expect(integrationTestContent).toMatch(/Verify component integration/);
    });

    it('should maintain the standard template structure', () => {
      expect(integrationTestContent).toMatch(/# integration-test/);
      expect(integrationTestContent).toMatch(/\[ACTUAL TASK GOES HERE\]/);
    });
  });

  describe('Documentation References', () => {
    it('should reference integration-test template in TDD workflow document', () => {
      expect(tddWorkflowContent).toMatch(/\+integration-test.*For testing component interactions/);
      expect(tddWorkflowContent).toMatch(/### \+integration-test Template/);
    });

    it('should reference integration-test template in TDD examples document', () => {
      expect(tddExamplesContent).toMatch(/### Integration Testing/);
      expect(tddExamplesContent).toMatch(/\+integration-test/);
      expect(tddExamplesContent).toMatch(/### Service Integration Implementation/);
    });
  });
});