# Command Update Plan

This document outlines the specific plan for updating each command to use the new output manager and error handling system.

## General Approach

For each command file:

1. Import the outputManager and errors modules
2. Replace direct console.log/error calls with outputManager methods
3. Use appropriate error classes for specific error conditions
4. Update tests to verify correct output

## Command Files to Update

1. **`src/commands/current.js`** (Already updated as example)
2. **`src/commands/create.js`**
   - Replace success/error log calls with output manager
   - Use TemplateNotFoundError for missing templates
   - Standardize the output format

3. **`src/commands/list.js`**
   - Replace all console logs with output.info/list
   - Use section formatting for the list of issues
   - Structure the output consistently

4. **`src/commands/show.js`**
   - Handle issue not found with IssueNotFoundError
   - Format the output consistently

5. **`src/commands/init.js`**
   - Use structured success messaging
   - Improve error handling

6. **`src/commands/completeTask.js`**
   - Streamline the complex output
   - Use appropriate error types
   - Fix the git error handling

7. **`src/commands/addNote.js`**
   - Use SectionNotFoundError for missing sections
   - Standardize error handling

8. **`src/commands/addQuestion.js`**
   - Use SectionNotFoundError for missing Questions section
   - Standardize output format

9. **`src/commands/addTask.js`**
   - Improve error messages for invalid tasks
   - Use appropriate error types

10. **`src/commands/logFailure.js`**
    - Use SectionNotFoundError for missing Failed approaches section
    - Fix formatting issues

11. **`src/commands/templates.js`**
    - Simplify the complex output structure
    - Use appropriate sections and formatting
    - Fix validation output

## Testing Updates

For each command:

1. Update existing tests to expect output to go to the correct stream
2. Add tests for different verbosity levels
3. Add tests to verify error handling
4. Verify exit codes are correct

## Implementation Steps

1. **Phase 1 (Core Infrastructure)**
   - ✅ Create outputManager.js
   - ✅ Create errors.js
   - ✅ Fix version flag handling
   - ✅ Update index.js with global flag handling

2. **Phase 2 (Critical Commands)**
   - ✅ Update current.js
   - Update create.js
   - Update list.js
   - Update show.js

3. **Phase 3 (Remaining Commands)**
   - Update init.js
   - Update completeTask.js
   - Update all remaining command files

4. **Phase 4 (Tests)**
   - Create test helpers for capturing output
   - Update critical command tests
   - Update remaining tests

5. **Phase 5 (Documentation)**
   - Document updated output formats
   - Update README with new flags
   - Add examples of different output modes

## Example Test Update

```javascript
// Before
test('current command with no issues', async () => {
  // Mock
  const mockIsInitialized = jest.spyOn(directory, 'isInitialized').mockResolvedValue(true);
  const mockListIssues = jest.spyOn(issueManager, 'listIssues').mockResolvedValue([]);
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  
  // Execute
  await currentAction();
  
  // Verify
  expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('No open issues found'));
});

// After
test('current command with no issues', async () => {
  // Mock
  const mockIsInitialized = jest.spyOn(directory, 'isInitialized').mockResolvedValue(true);
  const mockListIssues = jest.spyOn(issueManager, 'listIssues').mockResolvedValue([]);
  const mockOutputError = jest.spyOn(outputManager, 'error').mockImplementation();
  
  // Execute
  await currentAction();
  
  // Verify
  expect(mockOutputError).toHaveBeenCalledWith('No open issues found.');
});
```