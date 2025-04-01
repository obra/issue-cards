# Issue 0011: Simplify Note-Adding Functionality

## Problem to be solved
The current `add-note` command has overlapping functionality with specialized commands like `log-failure` and `add-question`, leading to user confusion and code complexity. Currently, the `add-note` command includes a `--format` option that replicates functionality already available in specialized commands.

## Planned approach
1. Remove the `--format` option from `add-note` command
2. Make `add-note` focus solely on adding plain text to sections
3. Ensure specialized commands like `log-failure` and `add-question` remain functional
4. Update documentation to reflect the clear separation of responsibilities
5. Update tests to ensure compatibility

## Failed approaches

## Questions to resolve
- Should we add a warning message if users try to use `--format` with `add-note`?
- Do we need to update any other commands that might depend on this functionality?

## Tasks
- [ ] Remove `--format` option from `addNote.js`
- [ ] Simplify the `addNoteAction` function to focus on plain text
- [ ] Update tests for `add-note` command
- [ ] Update documentation in `commands.md`
- [ ] Verify compatibility with existing functionality

## Instructions
Make the smallest reasonable changes that result in a simpler, more focused command. Ensure the command structure remains consistent with our naming and terminology guide.

## Next steps
After this is completed, we'll look at adding command aliases for improved user experience.