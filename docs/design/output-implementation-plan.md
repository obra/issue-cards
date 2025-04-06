# Output Handling Implementation Plan

This document details the specific implementation steps to improve the output handling in the Issue Cards CLI.

## Current Issues

Based on an initial assessment, the following issues exist:

1. Inconsistent use of console.log and console.error
2. Errors being printed to stdout instead of stderr
3. Error messages appearing in version output
4. Lack of verbosity controls
5. Inconsistent formatting of success and error messages
6. No standardized exit codes for different error types
7. Debug output mixed with normal output

## Implementation Steps

### Phase 1: Create Output Manager

1. Create a new module `src/utils/outputManager.js` with the following features:
   - Separated methods for different output types
   - Support for verbosity levels
   - Consistent formatting
   - Mocking capabilities for testing

2. The Output Manager should expose the following functions:
   ```javascript
   // Success output - goes to stdout
   success(message, options)
   
   // Regular informational output - goes to stdout
   info(message, options)
   
   // List output - goes to stdout
   list(items, options)
   
   // Table output - goes to stdout
   table(data, options)
   
   // Section output - goes to stdout
   section(title, content, options)
   
   // Warning output - goes to stderr
   warn(message, options)
   
   // Error output - goes to stderr
   error(message, errorType, options)
   
   // Debug output - goes to stderr, only if debug mode is on
   debug(message, options)
   ```

3. Add configuration options:
   - Verbosity level control
   - Color enablement/disablement
   - Output format (normal, json)

### Phase 2: Standardize Error Handling

1. Create custom error classes in a new module `src/utils/errors.js`:
   ```javascript
   class IssueCardsError extends Error {
     constructor(message, code = 1) {
       super(message);
       this.code = code;
     }
   }
   
   class UserError extends IssueCardsError {
     constructor(message) {
       super(message, 2);
     }
   }
   
   class SystemError extends IssueCardsError {
     constructor(message) {
       super(message, 3);
     }
   }
   
   class InternalError extends IssueCardsError {
     constructor(message) {
       super(message, 4);
     }
   }
   ```

2. Update the main program to handle these errors correctly:
   - Catch errors at the top level
   - Log appropriate messages
   - Exit with the correct code

### Phase 3: Fix Command Line Output

1. Update the binary script to handle version and help properly:
   - Ensure version output goes only to stdout
   - Fix the issue where "Error: 1.0.0" appears
   - Make sure help output is formatted consistently

2. Add global flags for output control:
   - `--quiet` or `-q`: Suppress all but error messages
   - `--verbose` or `-v`: Show more detailed output
   - `--debug` or `-d`: Show debug information
   - `--no-color`: Disable colored output
   - `--json`: Output in JSON format for machine parsing

### Phase 4: Refactor Commands

Update each command to use the new Output Manager:

1. `src/commands/create.js`
2. `src/commands/current.js`
3. `src/commands/list.js`
4. `src/commands/show.js`
5. `src/commands/init.js`
6. `src/commands/completeTask.js`
7. `src/commands/addNote.js`
8. `src/commands/addQuestion.js`
9. `src/commands/addTask.js`
10. `src/commands/logFailure.js`
11. `src/commands/templates.js`

For each command:
- Replace direct console.log/error calls with the appropriate Output Manager method
- Update error handling to use the new error classes
- Ensure consistent formatting of output

### Phase 5: Update Tests

1. Update test utilities to capture and verify output:
   - Create a test helper that can capture stdout and stderr
   - Add assertions for output content

2. Update each test to verify:
   - Success messages go to stdout
   - Error messages go to stderr
   - Output format is consistent
   - Exit codes are correct

3. Add specific tests for the Output Manager

### Phase 6: Documentation and Examples

1. Update documentation to reflect the new output behavior:
   - Exit codes
   - Output formats
   - Verbosity controls

2. Add examples showing different output modes:
   - Normal output
   - Quiet mode
   - Verbose mode
   - JSON output

## Specific Issue Fixes

### The version output issue

The issue with duplicate version output needs special attention:

```
❯ ./bin/issue-cards.js --version
1.0.0
Error: 1.0.0
```

This is likely caused by:
1. Commander's version handler printing the version to stdout
2. Something else catching the version string as an error and printing to stderr

Steps to fix:
1. Examine the bin/issue-cards.js and src/cli.js files
2. Look for error handlers that might be interpreting the version output incorrectly
3. Fix the error handling to prevent the error message

### Logging Framework Configuration

An example implementation of the logging framework might be:

```javascript
const VERBOSITY = {
  QUIET: 0,
  NORMAL: 1,
  VERBOSE: 2,
  DEBUG: 3
};

let currentVerbosity = VERBOSITY.NORMAL;
let useColors = true;
let jsonOutput = false;

function configure(options = {}) {
  if (options.quiet) currentVerbosity = VERBOSITY.QUIET;
  if (options.verbose) currentVerbosity = VERBOSITY.VERBOSE;
  if (options.debug) currentVerbosity = VERBOSITY.DEBUG;
  if (options.noColor !== undefined) useColors = !options.noColor;
  if (options.json) jsonOutput = true;
}

function success(message, options = {}) {
  if (currentVerbosity >= VERBOSITY.NORMAL) {
    if (jsonOutput) {
      console.log(JSON.stringify({ type: 'success', message }));
    } else {
      const formattedMessage = useColors ? chalk.green('✅ ' + message) : '✅ ' + message;
      console.log(formattedMessage);
    }
  }
}

// Similar implementations for other output types
```

## Timeline and Priority

1. **High Priority**:
   - Fix version output issue
   - Create Output Manager core functionality
   - Update error handling in main program

2. **Medium Priority**:
   - Refactor individual commands
   - Add verbosity controls
   - Update tests

3. **Lower Priority**:
   - Add JSON output support
   - Update documentation
   - Add examples