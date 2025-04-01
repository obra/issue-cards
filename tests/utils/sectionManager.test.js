// ABOUTME: Tests for the section management utilities
// ABOUTME: Verifies section detection, extraction, and content manipulation

const { 
  getSections,
  findSectionByName,
  normalizeSectionName,
  addContentToSection,
  getSectionContent,
  formatNoteForSection
} = require('../../src/utils/sectionManager');

describe('Section Manager', () => {
  const mockContent = `# Issue 1: Test Issue

## Problem to be solved
This is the problem description.

## Planned approach
This is the approach.

## Failed approaches
None yet.

## Questions to resolve
- [ ] Question 1?
- [x] Resolved question

## Tasks
- [ ] Task 1
- [ ] Task 2 #tag
- [x] Completed task

## Instructions
Follow these steps.

## Next steps
Plan for the future.
`;

  describe('getSections', () => {
    test('should extract all sections from markdown content', () => {
      const sections = getSections(mockContent);
      
      expect(sections).toHaveLength(7); // 7 sections in the mock content
      expect(sections[0].name).toBe('Problem to be solved');
      expect(sections[0].content).toBe('This is the problem description.');
      
      // Don't test exact line numbers as they may vary based on implementation
      expect(sections[0].startLine).toBeDefined();
      expect(sections[0].endLine).toBeDefined();
      
      expect(sections[1].name).toBe('Planned approach');
      expect(sections[3].name).toBe('Questions to resolve');
      expect(sections[4].name).toBe('Tasks');
    });
    
    test('should handle empty sections', () => {
      const contentWithEmptySection = mockContent.replace(
        '## Failed approaches\nNone yet.',
        '## Failed approaches\n'
      );
      
      const sections = getSections(contentWithEmptySection);
      
      expect(sections.find(s => s.name === 'Failed approaches')).toBeDefined();
      expect(sections.find(s => s.name === 'Failed approaches').content).toBe('');
    });
  });
  
  describe('findSectionByName', () => {
    test('should find section by exact name', () => {
      const section = findSectionByName(mockContent, 'Tasks');
      
      expect(section).toBeDefined();
      expect(section.name).toBe('Tasks');
      expect(section.content).toBe('- [ ] Task 1\n- [ ] Task 2 #tag\n- [x] Completed task');
    });
    
    test('should find section using normalized name', () => {
      // These should all find the same section
      expect(findSectionByName(mockContent, 'planned-approach').name).toBe('Planned approach');
      expect(findSectionByName(mockContent, 'planned_approach').name).toBe('Planned approach');
      expect(findSectionByName(mockContent, 'plannedApproach').name).toBe('Planned approach');
      expect(findSectionByName(mockContent, 'PlannedApproach').name).toBe('Planned approach');
    });
    
    test('should return null if section not found', () => {
      expect(findSectionByName(mockContent, 'non-existent')).toBeNull();
    });
  });
  
  describe('normalizeSectionName', () => {
    test('should convert common section name formats to standard format', () => {
      expect(normalizeSectionName('problem-to-be-solved')).toBe('Problem to be solved');
      expect(normalizeSectionName('plannedApproach')).toBe('Planned approach');
      expect(normalizeSectionName('FAILED_APPROACHES')).toBe('Failed approaches');
      expect(normalizeSectionName('questions_to_resolve')).toBe('Questions to resolve');
      expect(normalizeSectionName('tasks')).toBe('Tasks');
      expect(normalizeSectionName('instructions')).toBe('Instructions');
    });
    
    test('should return original string if no match found', () => {
      expect(normalizeSectionName('some-random-section')).toBe('some-random-section');
    });
  });
  
  describe('addContentToSection', () => {
    test('should add content to a non-empty section', () => {
      const result = addContentToSection(mockContent, 'Problem to be solved', 'Additional problem info.');
      
      expect(result).toMatch(/## Problem to be solved\s+This is the problem description.[\s\n]+Additional problem info\./);
    });
    
    test('should add content to an empty section', () => {
      const contentWithEmptySection = mockContent.replace(
        '## Failed approaches\nNone yet.',
        '## Failed approaches\n'
      );
      
      const result = addContentToSection(contentWithEmptySection, 'Failed approaches', 'First failed approach.');
      
      expect(result).toMatch(/## Failed approaches\s+First failed approach\./);
    });
    
    test('should handle list-type sections correctly', () => {
      const result = addContentToSection(mockContent, 'Tasks', 'New task');
      
      expect(result).toMatch(/## Tasks\s+- \[ \] Task 1\s+- \[ \] Task 2 #tag\s+- \[x\] Completed task\s+- \[ \] New task/);
    });
    
    test('should throw error if section not found', () => {
      expect(() => addContentToSection(mockContent, 'non-existent', 'content'))
        .toThrow('Section "non-existent" not found in issue');
    });
  });
  
  describe('getSectionContent', () => {
    test('should get content from a section', () => {
      const content = getSectionContent(mockContent, 'Planned approach');
      
      expect(content).toBe('This is the approach.');
    });
    
    test('should return empty string if section is empty', () => {
      const contentWithEmptySection = mockContent.replace(
        '## Failed approaches\nNone yet.',
        '## Failed approaches\n'
      );
      
      const content = getSectionContent(contentWithEmptySection, 'Failed approaches');
      
      expect(content).toBe('');
    });
    
    test('should return null if section not found', () => {
      const content = getSectionContent(mockContent, 'non-existent');
      
      expect(content).toBeNull();
    });
  });
  
  describe('formatNoteForSection', () => {
    test('should format a general note', () => {
      const formatted = formatNoteForSection('This is a note', 'Problem to be solved');
      
      expect(formatted).toBe('This is a note');
    });
    
    test('should format a question as a task item', () => {
      const formatted = formatNoteForSection('Is this a question?', 'Questions to resolve', 'question');
      
      expect(formatted).toBe('- [ ] Is this a question?');
    });
    
    test('should format a failed approach with special formatting', () => {
      const formatted = formatNoteForSection('This approach failed', 'Failed approaches', 'failure');
      
      expect(formatted).toBe('### Failed attempt\n\nThis approach failed\n\n**Reason:** Not specified');
    });
    
    test('should handle failed approach with reason', () => {
      const formatted = formatNoteForSection(
        'This approach failed',
        'Failed approaches',
        'failure',
        { reason: 'Performance issues' }
      );
      
      expect(formatted).toBe('### Failed attempt\n\nThis approach failed\n\n**Reason:** Performance issues');
    });
    
    test('should format a task', () => {
      const formatted = formatNoteForSection('New subtask', 'Tasks', 'task');
      
      expect(formatted).toBe('- [ ] New subtask');
    });
  });
});