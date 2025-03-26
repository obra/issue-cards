# Issue Cards Error Handling Refactoring

## Overview

The issue cards codebase currently has a systematic bug where error messages are displayed twice:
1. Once at the command level, where each command formats and displays its own errors
2. Once at the top level in index.js, where errors are caught and displayed again

This task involves refactoring the error handling across the codebase to implement a centralized approach.

## Goals

- Eliminate duplicate error messages
- Standardize error handling across all commands
- Maintain context-rich error messages
- Use our existing error class hierarchy effectively
- Ensure consistent exit codes are used

## Task List

### 1. Update Error Base Class

- [x] Modify `src/utils/errors.js` to add method for capturing context
- Example:
  ```javascript
  class IssueCardsError extends Error {
    constructor(message, code = 1) {
      super(message);
      this.name = 'IssueCardsError';
      this.code = code;
      this.recoveryHint = '';
      this.displayMessage = null; // New property to store formatted message
      this.displayed = false;     // Flag to track if error was already displayed
    }

    withRecoveryHint(hint) {
      this.recoveryHint = hint;
      return this;
    }

    // New method for adding display message
    withDisplayMessage(message) {
      this.displayMessage = message;
      return this;
    }

    // New method for marking as displayed
    markDisplayed() {
      this.displayed = true;
      return this;
    }
  }
  ```

### 2. Update Command Files

Update all command actions to format errors but not display them directly:

- [x] `src/commands/addNote.js` (COMPLETED)
- [x] `src/commands/addQuestion.js` (COMPLETED)
- [x] `src/commands/addTask.js` (COMPLETED)
- [x] `src/commands/completeTask.js` (COMPLETED)
- [x] `src/commands/create.js` (COMPLETED)
- [x] `src/commands/current.js` (COMPLETED)
- [ ] `src/commands/init.js` (PENDING)
- [ ] `src/commands/list.js` (PENDING)
- [ ] `src/commands/logFailure.js` (PENDING)
- [x] `src/commands/show.js` (COMPLETED)
- [x] `src/commands/templates.js` (COMPLETED)

Example update for each command (using `addNote.js` as example):

```javascript
// Old version with duplicate error handling
try {
  // Command logic
} catch (err) {
  if (err instanceof UserError || err instanceof SectionNotFoundError) {
    output.error(`${err.message}${err.recoveryHint ? ` (${err.recoveryHint})` : ''}`);
  } else {
    output.error(`Failed to add note: ${err.message}`);
  }
  throw err; // This causes the duplicate error
}

// New version - format error but don't display it
try {
  // Command logic
} catch (err) {
  if (err instanceof UserError || err instanceof SectionNotFoundError) {
    // Add context but don't display directly
    err.withDisplayMessage(`${err.message}${err.recoveryHint ? ` (${err.recoveryHint})` : ''}`);
  } else {
    // Wrap non-IssueCardsError errors
    err = new SystemError(`Failed to add note: ${err.message}`)
      .withDisplayMessage(`Failed to add note: ${err.message}`);
  }
  throw err; // Just pass it up to the central handler
}
```

### 3. Update Top-Level Error Handler

- [x] Modify `src/index.js` to use the pre-formatted messages from commands
- Example:
  ```javascript
  try {
    const program = await createProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    // Handle different error types
    if (error instanceof IssueCardsError) {
      // Use the pre-formatted display message if available
      const message = error.displayMessage || 
                    `${error.message}${error.recoveryHint ? ` (${error.recoveryHint})` : ''}`;
      outputManager.error(message);
      process.exit(error.code);
    } else {
      // For unexpected errors
      outputManager.error(`Unexpected error: ${error.message}`);
      
      // Show stack trace in debug mode
      if (globalArgs.debug) {
        outputManager.debug(error.stack);
      }
      
      process.exit(1);
    }
  }
  ```

### 4. Update Commander Error Handling

- [x] Update exit override in `src/cli.js` to work with the new approach
- Example:
  ```javascript
  .exitOverride((err) => {
    // Custom handling for commander exit
    if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
      // Help and version are success cases, exit cleanly
      process.exit(0);
    }
    
    if (err.code === 'commander.unknownCommand') {
      // Create a proper IssueCardsError
      const error = new UserError(`Unknown command: ${err.message}`);
      error.withDisplayMessage(`Unknown command: ${err.message}`);
      throw error;
    }
    
    throw err;
  });
  ```

### 5. Update Tests

- [x] Review and update tests that rely on the current error handling
- Focus on:
  - [x] `tests/commands/addNote.test.js` (COMPLETED)
  - [x] `tests/commands/addQuestion.test.js` (COMPLETED)
  - [x] `tests/commands/addTask.test.js` (COMPLETED)
  - [x] `tests/commands/completeTask.test.js` (COMPLETED)
  - [x] `tests/commands/create.test.js` (COMPLETED)
  - [x] `tests/commands/current.test.js` (COMPLETED)
  - [ ] `tests/commands/init.test.js` (PENDING)
  - [ ] `tests/commands/list.test.js` (PENDING)
  - [ ] `tests/commands/logFailure.test.js` (PENDING)
  - [x] `tests/commands/show.test.js` (COMPLETED)
  - [x] `tests/commands/templates.test.js` (COMPLETED)
  - [x] Some E2E tests that verify error messages (PARTIALLY COMPLETED)
    - [x] `tests/e2e/current-output.test.js` (COMPLETED)
    - [ ] Other E2E tests showing errors (PENDING)

Example test update:
```javascript
// Old test
test('should throw error if section is not found', async () => {
  fs.readFile.mockResolvedValue(mockIssueContent);

  // Call with invalid section
  await expect(addNoteAction('Note for invalid section', { 
    issueNumber: 1, 
    section: 'non-existent-section' 
  })).rejects.toThrow('Section "non-existent-section" not found in issue');
});

// New test - check for error type and properties
test('should throw error if section is not found', async () => {
  fs.readFile.mockResolvedValue(mockIssueContent);

  // Call with invalid section
  try {
    await addNoteAction('Note for invalid section', { 
      issueNumber: 1, 
      section: 'non-existent-section' 
    });
    fail('Should have thrown an error');
  } catch (error) {
    expect(error).toBeInstanceOf(SectionNotFoundError);
    expect(error.message).toContain('non-existent-section');
    expect(error.displayMessage).toBeDefined();
  }
});
```

### 6. Documentation

- [x] Update design documentation to explain the error handling architecture
- [x] Add comments in key files explaining the error handling approach
- [ ] Consider adding example in developer docs

## Remaining Tasks

1. Update remaining command files to use the new error handling approach:
   - [x] `src/commands/create.js`
   - [x] `src/commands/current.js`
   - [ ] `src/commands/init.js`
   - [ ] `src/commands/list.js`
   - [ ] `src/commands/logFailure.js`
   - [x] `src/commands/show.js`
   - [x] `src/commands/templates.js`

2. Update corresponding test files:
   - [x] `tests/commands/create.test.js`
   - [x] `tests/commands/current.test.js`
   - [ ] `tests/commands/init.test.js`
   - [ ] `tests/commands/list.test.js`
   - [ ] `tests/commands/logFailure.test.js`
   - [x] `tests/commands/show.test.js`
   - [x] `tests/commands/templates.test.js`

3. Fix remaining E2E test failures:
   - [ ] Identify and update additional E2E tests affected by error handling changes
   - [ ] Check for duplicate error message issues in lifecycle tests

4. Final verification:
   - [ ] Run all tests to ensure no regressions were introduced
   - [ ] Manually test the command-line tool with error scenarios to verify behavior

## Testing Strategy

1. Test each command individually to ensure it now properly formats errors without displaying them
2. Test the top-level error handling to verify it correctly displays the formatted errors
3. Run E2E tests to confirm no duplicate error messages
4. Test specific error cases to verify the correct exit codes are used
5. Verify that error recovery hints are still displayed correctly

## Additional Notes

- Pay special attention to E2E tests in `tests/e2e/lifecycle.test.js` as they might be affected
- The approach should work with Commander.js's built-in error handling
- Consider adding a debug log when errors are caught at top level (when in debug mode)