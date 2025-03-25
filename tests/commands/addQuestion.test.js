// ABOUTME: Tests for the add-question command
// ABOUTME: Verifies adding questions to issues

const fs = require('fs').promises;
const path = require('path');
const { addQuestionAction } = require('../../src/commands/addQuestion');
const { getIssueFilePath } = require('../../src/utils/directory');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined),
  }
}));

jest.mock('../../src/utils/directory', () => ({
  getIssueFilePath: jest.fn(),
  getIssuesRootDir: jest.fn().mockReturnValue('/test/issues'),
}));

jest.mock('../../src/utils/issueManager', () => ({
  getCurrentIssue: jest.fn().mockResolvedValue({ number: 2 }),
}));

// Import getCurrentIssue after mocking
const { getCurrentIssue } = require('../../src/utils/issueManager');


describe('addQuestion command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getIssueFilePath.mockReturnValue('/test/issues/open/issue-1.md');
    fs.writeFile.mockClear();
  });

  const mockIssueContent = `# Issue 1: Test Issue

## Problem to be solved
Problem description

## Planned approach
Initial approach

## Failed approaches
No failed approaches yet

## Questions to resolve
- [ ] Existing question?

## Tasks
- [ ] Task 1
- [ ] Task 2

## Instructions
Follow these steps

## Next steps
None yet
`;

  test('should add a question to the Questions to resolve section', async () => {
    // Mock file read to return test content
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Call the action
    await addQuestionAction('New question that needs an answer?', { 
      issueNumber: 1 
    });

    // Verify the file was read correctly
    expect(getIssueFilePath).toHaveBeenCalledWith(1);
    expect(fs.readFile).toHaveBeenCalledWith('/test/issues/open/issue-1.md', 'utf8');

    // Check that writeFile was called - the content format might vary slightly based on implementation
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has both the existing question and the new question
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('- [ ] Existing question?');
    expect(writtenContent).toContain('- [ ] New question that needs an answer?');
  });

  test('should use current issue if no issue number provided', async () => {
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
    await addQuestionAction('Question for current issue?');

    // Verify current issue was used
    expect(getCurrentIssue).toHaveBeenCalled();
    expect(getIssueFilePath).toHaveBeenCalledWith(2);
    
    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-2.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the question
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('- [ ] Question for current issue?');
  });

  test('should handle empty Questions section correctly', async () => {
    // Issue with empty questions section
    const emptyQuestionsContent = mockIssueContent.replace(
      '## Questions to resolve\n- [ ] Existing question?',
      '## Questions to resolve\n'
    );
    
    fs.readFile.mockResolvedValue(emptyQuestionsContent);

    // Add question to empty section
    await addQuestionAction('First question?', { 
      issueNumber: 1 
    });

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the question
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('- [ ] First question?');
  });

  test('should work if the question already ends with a question mark', async () => {
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Call with a question that already has a question mark
    await addQuestionAction('Does this work?', { 
      issueNumber: 1 
    });

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the question without an extra question mark
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('- [ ] Does this work?');
    // Make sure there's no double question mark
    expect(writtenContent).not.toContain('- [ ] Does this work??');
  });

  test('should add a question mark if the question doesn\'t end with one', async () => {
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Call with text that doesn't end with a question mark
    await addQuestionAction('Is this a question', { 
      issueNumber: 1 
    });

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the question with a question mark added
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('- [ ] Is this a question?');
  });

  test('should throw error if Questions section is not found', async () => {
    // Content missing the Questions section
    const contentWithoutSection = mockIssueContent.replace(
      '## Questions to resolve\n- [ ] Existing question?\n\n',
      ''
    );
    
    fs.readFile.mockResolvedValue(contentWithoutSection);

    // Should throw an error
    await expect(addQuestionAction('This will fail?', { 
      issueNumber: 1 
    })).rejects.toThrow('Section "Questions to resolve" not found in issue');
  });
});