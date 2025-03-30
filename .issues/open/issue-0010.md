# Issue 0010: Fix Standardize command line argument naming

## Problem to be solved
Command line argument naming is inconsistent across different commands. For example, add-note uses --issue-number while add-task uses --issue for the same functionality. This inconsistency creates confusion for users and makes the application harder to use.


## Planned approach
Establish consistent naming conventions for all command line arguments. Update all commands to follow these conventions. Create documentation that explains the naming conventions and their rationale. Ensure all documentation is updated to reflect the standardized argument names.


## Failed approaches


## Questions to resolve


## Tasks
- [x] Fix add-note to use --issue instead of --issue-number to match add-task
- [ ] Audit all commands to ensure coherent command line arguments across the application
- [ ] Create documentation on the structure and philosophy of argument naming conventions
- [ ] Audit all documentation to ensure it reflects the standardized argument naming

## Instructions


## Next steps

