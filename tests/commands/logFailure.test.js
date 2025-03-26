// ABOUTME: Tests for the log-failure command
// ABOUTME: Verifies logging failed approaches to issues

const fs = require('fs').promises;
const path = require('path');
const { logFailureAction } = require('../../src/commands/logFailure');
const { UserError, SectionNotFoundError, SystemError } = require('../../src/utils/errors');
// Import after mocking
const { getIssueFilePath } = require('../../src/utils/issueManager');

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

// Import getCurrentIssue after mocking
const { getCurrentIssue } = require('../../src/utils/issueManager');


describe('logFailure command', () => {
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
- [ ] Question 1?

## Tasks
- [ ] Task 1
- [ ] Task 2

## Instructions
Follow these steps

## Next steps
None yet
`;

  test('should add a failed approach to the Failed approaches section', async () => {
    // Mock file read to return test content
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Call the action
    await logFailureAction('This approach didnt work', { 
      issueNumber: 1, 
      reason: 'Performance issues'
    });

    // Verify the file was read correctly
    expect(getIssueFilePath).toHaveBeenCalledWith("0001");
    expect(fs.readFile).toHaveBeenCalledWith('/test/issues/open/issue-1.md', 'utf8');

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the failure information
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('### Failed attempt');
    expect(writtenContent).toContain('This approach didnt work');
    expect(writtenContent).toContain('**Reason:** Performance issues');
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
    await logFailureAction('Another failed approach', { 
      reason: 'API limitations'
    });

    // Verify current issue was used
    expect(getCurrentIssue).toHaveBeenCalled();
    expect(getIssueFilePath).toHaveBeenCalledWith("0002");
    
    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-2.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the failure information
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('### Failed attempt');
    expect(writtenContent).toContain('Another failed approach');
    expect(writtenContent).toContain('**Reason:** API limitations');
  });

  test('should use "Not specified" if no reason is provided', async () => {
    fs.readFile.mockResolvedValue(mockIssueContent);

    // Call without a reason
    await logFailureAction('Failed attempt with no reason', { 
      issueNumber: 1 
    });

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has the failure information with "Not specified" reason
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('### Failed attempt');
    expect(writtenContent).toContain('Failed attempt with no reason');
    expect(writtenContent).toContain('**Reason:** Not specified');
  });

  test('should add a failed approach when there are already other failures', async () => {
    // Content with existing failures
    const contentWithFailures = mockIssueContent.replace(
      '## Failed approaches\nNo failed approaches yet',
      '## Failed approaches\n### Failed attempt\n\nExisting failure\n\n**Reason:** Old reason'
    );
    
    fs.readFile.mockResolvedValue(contentWithFailures);

    // Add another failure
    await logFailureAction('New failed approach', { 
      issueNumber: 1, 
      reason: 'New reason'
    });

    // Check that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeFile.mock.calls[0][0]).toBe('/test/issues/open/issue-1.md');
    expect(fs.writeFile.mock.calls[0][2]).toBe('utf8');
    
    // Verify content has both existing and new failure information
    const writtenContent = fs.writeFile.mock.calls[0][1];
    expect(writtenContent).toContain('Existing failure');
    expect(writtenContent).toContain('**Reason:** Old reason');
    expect(writtenContent).toContain('New failed approach');
    expect(writtenContent).toContain('**Reason:** New reason');
  });

  test('should throw error if Failed approaches section is not found', async () => {
    // Content missing the Failed approaches section
    const contentWithoutSection = mockIssueContent.replace(
      '## Failed approaches\nNo failed approaches yet\n\n',
      ''
    );
    
    fs.readFile.mockResolvedValue(contentWithoutSection);

    // Should throw a SectionNotFoundError with displayMessage
    try {
      await logFailureAction('This will fail', { issueNumber: 1 });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(SectionNotFoundError);
      expect(error.displayMessage).toContain('Section "Failed approaches" not found');
    }
  });
  
  test('should throw UserError if no current issue and no issue number', async () => {
    // Mock getCurrentIssue to return null
    getCurrentIssue.mockResolvedValue(null);
    
    try {
      await logFailureAction('This will fail', {});
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UserError);
      expect(error.displayMessage).toContain('No current issue found');
      expect(error.recoveryHint).toContain('Specify an issue number');
    }
  });
  
  test('should wrap and throw system errors', async () => {
    // Mock fs.readFile to throw a generic error
    const fsError = new Error('File system error');
    fs.readFile.mockRejectedValue(fsError);
    
    try {
      await logFailureAction('This will fail', { issueNumber: 1 });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(SystemError);
      expect(error.message).toContain('Failed to log approach');
      expect(error.displayMessage).toContain('Failed to log approach: File system error');
    }
  });
});