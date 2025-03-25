// ABOUTME: Tests for the add-note command
// ABOUTME: Verifies note addition to specific sections of issues

const fs = require('fs').promises;
const path = require('path');
const { addNoteAction } = require('../../src/commands/addNote');
// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined),
  }
}));

jest.mock('../../src/utils/directory', () => ({
  getIssueDirectoryPath: jest.fn().mockReturnValue('/test/issues'),
}));

jest.mock('../../src/utils/issueManager', () => ({
  getIssueFilePath: jest.fn().mockReturnValue('/test/issues/open/issue-1.md'),
  getCurrentIssue: jest.fn().mockResolvedValue({ number: 2 }),
}));

// Import after mocking
const { getIssueFilePath } = require('../../src/utils/issueManager');

// Import getCurrentIssue after mocking
const { getCurrentIssue } = require('../../src/utils/issueManager');


describe('addNote command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getIssueFilePath.mockReturnValue('/test/issues/open/issue-1.md');
    fs.writeFile.mockClear();
  });

  const mockIssueContent = `# Issue 1: Test Issue

## Problem to be solved
Initial problem description

## Planned approach
Initial approach

## Failed approaches
No failed approaches yet

## Questions to resolve
- [ ] Question 1?

## Tasks
- [ ] Task 1
- [ ] Task 2

## Instructions
Follow these steps

## Next steps
None yet
`;

  test('should add a note to the specified section', async () => {
    // Mock file read to return test content
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Call the action
    await addNoteAction('This is a new note', { 
      issueNumber: 1, 
      section: 'problem' 
    });

    // Verify the file was read correctly
    expect(getIssueFilePath).toHaveBeenCalledWith("0001");
    expect(fs.readFile).toHaveBeenCalledWith('/test/issues/open/issue-1.md', 'utf8');

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the note added
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Initial problem description');
    expect(writtenContent).toContain('This is a new note');
  });

  test('should add a note to the end of a section when section is empty', async () => {
    // Mock content with an empty section
    const mockContentWithEmptySection = mockIssueContent.replace(
      '## Failed approaches\nNo failed approaches yet',
      '## Failed approaches\n'
    );
    
    fs.readFile.mockResolvedValue(mockContentWithEmptySection);

    // Call the action
    await addNoteAction('This is my first failed approach', { 
      issueNumber: 1, 
      section: 'failed-approaches' 
    });

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the note added
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('## Failed approaches');
    expect(writtenContent).toContain('This is my first failed approach');
  });

  test('should use current issue if no issue number is provided', async () => {
    // Mock for current issue
    const mockCurrentIssueContent = `# Issue 2: Current Issue

## Problem to be solved
Problem for current issue

## Planned approach
Approach for current issue

## Failed approaches
No failed approaches yet

## Questions to resolve
No questions yet

## Tasks
- [x] Task 1
- [ ] Task 2

## Instructions
Instructions for current issue

## Next steps
Next steps for current issue
`;

    fs.readFile.mockResolvedValue(mockCurrentIssueContent);
    getIssueFilePath.mockReturnValue('/test/issues/open/issue-2.md');

    // Call the action with no issue number
    await addNoteAction('New note for current issue', { 
      section: 'approach' 
    });

    // Verify current issue was used
    expect(getCurrentIssue).toHaveBeenCalled();
    expect(getIssueFilePath).toHaveBeenCalledWith("0002");
    
    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-2.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the note added
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Approach for current issue');
    expect(writtenContent).toContain('New note for current issue');
  });

  test('should throw error if section is not found', async () => {
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Call with invalid section
    await expect(addNoteAction('Note for invalid section', { 
      issueNumber: 1, 
      section: 'non-existent-section' 
    })).rejects.toThrow('Section "non-existent-section" not found in issue');
  });

  test('should normalize section names', async () => {
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Call with various forms of the same section
    await addNoteAction('New approach note', { 
      issueNumber: 1, 
      section: 'planned-approach' 
    });

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the note added to the right section
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Initial approach');
    expect(writtenContent).toContain('New approach note');
  });

  test('should format the note based on section type', async () => {
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Add a question
    await addNoteAction('New question to resolve?', { 
      issueNumber: 1, 
      section: 'questions',
      format: 'question'
    });

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify question was added as a task item
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('- [ ] Question 1?');
    expect(writtenContent).toContain('- [ ] New question to resolve?');
  });
});