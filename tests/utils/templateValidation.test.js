// ABOUTME: Tests for template validation utilities
// ABOUTME: Verifies template structure validation functionality

const fs = require('fs');
const path = require('path');
const { validateTemplateStructure } = require('../../src/utils/templateValidation');
const { getTemplatePath } = require('../../src/utils/template');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
  },
  constants: { F_OK: 0 },
}));

jest.mock('../../src/utils/template', () => ({
  getTemplatePath: jest.fn(),
}));

describe('Template validation utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('validateTemplateStructure', () => {
    test('validates issue template structure successfully', async () => {
      // Mock template path
      getTemplatePath.mockReturnValue('/project/.issues/config/templates/issue/feature.md');
      
      // Mock template content
      const validIssueTemplate = `# Issue {NUMBER}: {TITLE}

## Problem to be solved
{PROBLEM}

## Planned approach
{APPROACH}

## Failed approaches
{FAILED_APPROACHES}

## Questions to resolve
{QUESTIONS}

## Tasks
{TASKS}

## Instructions
{INSTRUCTIONS}

## Next steps
{NEXT_STEPS}`;
      
      fs.promises.readFile.mockResolvedValue(validIssueTemplate);
      
      const result = await validateTemplateStructure('feature', 'issue');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(getTemplatePath).toHaveBeenCalledWith('feature', 'issue');
      expect(fs.promises.readFile).toHaveBeenCalledWith('/project/.issues/config/templates/issue/feature.md', 'utf8');
    });
    
    test('validates tag template structure successfully', async () => {
      // Mock template path
      getTemplatePath.mockReturnValue('/project/.issues/config/templates/tag/unit-test.md');
      
      // Mock template content
      const validTagTemplate = `# unit-test

## Steps
- Write failing unit tests for the functionality
- Run the unit tests and verify they fail for the expected reason
- [ACTUAL TASK GOES HERE]
- Run unit tests and verify they now pass
- Make sure test coverage meets project requirements`;
      
      fs.promises.readFile.mockResolvedValue(validTagTemplate);
      
      const result = await validateTemplateStructure('unit-test', 'tag');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(getTemplatePath).toHaveBeenCalledWith('unit-test', 'tag');
      expect(fs.promises.readFile).toHaveBeenCalledWith('/project/.issues/config/templates/tag/unit-test.md', 'utf8');
    });
    
    test('returns errors for invalid issue template structure', async () => {
      // Mock template path
      getTemplatePath.mockReturnValue('/project/.issues/config/templates/issue/invalid.md');
      
      // Mock template content with missing required sections
      const invalidIssueTemplate = `# Issue {NUMBER}: {TITLE}

## Problem to be solved
{PROBLEM}

## Planned approach
{APPROACH}

## Some random section
Content here

## Tasks
{TASKS}`;
      
      fs.promises.readFile.mockResolvedValue(invalidIssueTemplate);
      
      const result = await validateTemplateStructure('invalid', 'issue');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Missing required section: Failed approaches');
      expect(result.errors).toContain('Missing required section: Questions to resolve');
      expect(result.errors).toContain('Missing required section: Instructions');
      expect(result.errors).toContain('Missing required section: Next steps');
      expect(getTemplatePath).toHaveBeenCalledWith('invalid', 'issue');
    });
    
    test('returns errors for invalid tag template structure', async () => {
      // Mock template path
      getTemplatePath.mockReturnValue('/project/.issues/config/templates/tag/invalid.md');
      
      // Mock template content with missing required sections
      const invalidTagTemplate = `# invalid-tag

## Some section
- Step 1
- Step 2`;
      
      fs.promises.readFile.mockResolvedValue(invalidTagTemplate);
      
      const result = await validateTemplateStructure('invalid', 'tag');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Missing required section: Steps');
      expect(getTemplatePath).toHaveBeenCalledWith('invalid', 'tag');
    });
    
    test('returns error when file cannot be read', async () => {
      // Mock template path
      getTemplatePath.mockReturnValue('/project/.issues/config/templates/issue/nonexistent.md');
      
      // Mock file read error
      fs.promises.readFile.mockRejectedValue(new Error('File not found'));
      
      const result = await validateTemplateStructure('nonexistent', 'issue');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Template file could not be read');
      expect(getTemplatePath).toHaveBeenCalledWith('nonexistent', 'issue');
    });
    
    test('validates template variables in issue template', async () => {
      // Mock template path
      getTemplatePath.mockReturnValue('/project/.issues/config/templates/issue/missing-vars.md');
      
      // Mock template content with missing variables
      const templateWithMissingVars = `# Issue {NUMBER}: {TITLE}

## Problem to be solved
No variable here

## Planned approach
{APPROACH}

## Failed approaches
{FAILED_APPROACHES}

## Questions to resolve
{QUESTIONS}

## Tasks
No variable here either

## Instructions
{INSTRUCTIONS}

## Next steps
{NEXT_STEPS}`;
      
      fs.promises.readFile.mockResolvedValue(templateWithMissingVars);
      
      const result = await validateTemplateStructure('missing-vars', 'issue');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Missing variable placeholder: {PROBLEM}');
      expect(result.errors).toContain('Missing variable placeholder: {TASKS}');
      expect(getTemplatePath).toHaveBeenCalledWith('missing-vars', 'issue');
    });
    
    test('validates tag template contains placeholder marker', async () => {
      // Mock template path
      getTemplatePath.mockReturnValue('/project/.issues/config/templates/tag/missing-placeholder.md');
      
      // Mock template content with missing placeholder
      const templateWithMissingPlaceholder = `# missing-placeholder

## Steps
- Step 1
- Step 2
- Step 3
- Step 4`;
      
      fs.promises.readFile.mockResolvedValue(templateWithMissingPlaceholder);
      
      const result = await validateTemplateStructure('missing-placeholder', 'tag');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Tag template does not contain [ACTUAL TASK GOES HERE] placeholder');
      expect(getTemplatePath).toHaveBeenCalledWith('missing-placeholder', 'tag');
    });
  });
});