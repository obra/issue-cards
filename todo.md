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
