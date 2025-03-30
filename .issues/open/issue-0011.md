# Issue 0011: Simplify note-adding functionality

## Problem to be solved
The current note-adding functionality is unnecessarily complex with overlapping responsibilities between commands. The add-note command has a format option that can create formatted content (questions, failures, tasks), while we also have specialized commands (add-question, log-failure) that do the same thing. This creates confusion for users and adds complexity to the codebase.


## Planned approach
Simplify the add-note command to focus solely on adding plain text notes to specified sections:

1. Keep the --section option for specifying which section to add the note to
2. Remove the --format option from add-note 
3. Keep specialized commands like log-failure for formatted content
4. Update documentation to clearly explain the purpose of each command

The goal is to make each command have a single, clear responsibility:
- add-note: Add plain text to a specific section
- log-failure: Add a formatted failure entry to the Failed approaches section
- add-question: Add a formatted question to the Questions to resolve section


## Failed approaches


## Questions to resolve


## Tasks


- [ ] Update add-note command to remove format options and focus on sections
- [ ] Update tests for add-note to reflect simplified behavior
- [ ] Update documentation to reflect the simplified note-adding functionality
- [ ] Ensure specialized commands like log-failure remain functional
- [ ] Update MCP tools to align with the simplified approach
- [ ] Run full test suite to ensure changes don't break existing functionality
## Instructions
Follow the project's naming and terminology guide for consistency. Ensure all commands maintain their short option forms for key parameters. Keep error messages helpful and consistent with existing patterns. Add clear examples in both code comments and documentation. This is pre-release software, so backward compatibility is not required.


## Next steps

