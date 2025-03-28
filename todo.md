# Task Expansion Tag Refactoring

This plan outlines the changes needed to improve the task tag system by:

1. Changing from `#tag` to `+tag` syntax for template expansions
2. Only expanding tags at the end of tasks
3. Treating `#tag` as regular text with no special handling

## Phase 1: Write Tests for New Functionality

### Task Parser Tests
- [x] Add tests for new `extractExpandTagsFromTask` function that finds `+tag` patterns
- [x] Add tests for new `isTagAtEnd` helper function
- [x] Add tests for modified `getCleanTaskText` to strip `+tag` patterns
- [x] Verify that `#tag` patterns are treated as plain text

### Task Expander Tests
- [x] Add tests for `expandTask` with new `+tag` syntax
- [x] Add tests to verify tags in the middle of text are not expanded
- [x] Add tests to verify `#tag` is treated as plain text (not expanded)

### Command Tests
- [x] Update `create.test.js` to test `+tag` expansion only
- [x] Update `addTask.test.js` to test `+tag` expansion only
- [x] Add tests to verify `#tag` is no longer expanded

## Phase 2: Update Tag Templates

- [x] Update all existing tag templates to work with new system
- [x] Verify all templates use correct `[ACTUAL TASK GOES HERE]` placeholder
- [x] Remove any special handling for `#tag` syntax

## Phase 3: Implement Code Changes

### Task Parser
- [x] Implement new `extractExpandTagsFromTask` function that looks for `+tag` pattern
- [x] Implement `isTagAtEnd` helper function
- [x] Update `getCleanTaskText` to also remove `+tag` patterns
- [x] Remove special handling for `#tag` patterns

### Task Expander
- [x] Update `expandTask` function to use the new `extractExpandTagsFromTask` function
- [x] Only expand tags that are at the end of a task
- [x] Remove any handling of `#tag` syntax

### Commands
- [x] Update `create.js` to use the new tag expansion approach
- [x] Update `addTask.js` to use the new tag expansion approach
- [x] Remove handling of `#tag` syntax for expansion

## Phase 4: Fix Legacy Tests

- [x] Fix failing create command tests
- [x] Fix failing addTask command tests 
- [x] Fix failing taskExpander tests
- [x] Fix failing taskParser tests
- [x] Verify all tests pass with new implementation

## Phase 5: Documentation Updates

- [x] Update `templates.md` to reflect new syntax
- [x] Update `workflows.md` to show examples of the new syntax
- [x] Clearly explain `+tag` expansion behavior
- [x] Clarify that `#tag` is treated as plain text

## Testing Strategy

1. Write tests for new functionality first (TDD approach)
2. Update templates before code changes
3. Implement code changes to pass new tests
4. Fix any existing tests affected by the changes
5. Run full test suite to verify all tests pass

# Implement Set Current Issue Command

This plan outlines the tasks needed to implement a new command that allows users to explicitly set which issue is considered "current":

## Phase 1: Write Tests

- [ ] Add unit tests for the new command in `tests/commands/setCurrent.test.js`
- [ ] Test handling of non-existent issues
- [ ] Test handling of closed issues
- [ ] Test successful setting of current issue
- [ ] Add E2E tests in `tests/e2e/commands.test.js` for the new command

## Phase 2: Implement Storage Mechanism

- [ ] Create a `.current` file in the `.issues` directory to store the current issue number
- [ ] Modify `getCurrentIssue` in `issueManager.js` to check this file first
- [ ] Add a `setCurrentIssue` function to `issueManager.js`
- [ ] Update the fallback logic to use alphabetical ordering when no current issue is set

## Phase 3: Implement Command

- [ ] Create `src/commands/setCurrent.js` file
- [ ] Implement the command with validation
- [ ] Add the command to the CLI in `src/cli.js`
- [ ] Handle error cases (non-existent issue, closed issue)

## Phase 4: Update Documentation

- [ ] Add documentation for the new command in `docs/commands.md`
- [ ] Update any workflow examples to show how to use the command
- [ ] Add helpful messaging in command output

## Phase 5: Integration

- [ ] Update relevant commands to respect the explicitly set current issue
- [ ] Ensure closing an issue that's set as current clears the `.current` file
- [ ] Add unit tests for this integration