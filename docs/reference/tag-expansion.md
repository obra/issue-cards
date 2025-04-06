# Task Tag Expansion System

This document provides a comprehensive reference for the tag expansion system in issue-cards.

## Overview

The tag expansion system allows you to define reusable task sequences as "tags" that can be expanded into multiple tasks when referenced. Tags help standardize common workflows like testing, documentation, and code review.

## Tag Definition

Tags are defined in markdown files in the `/templates/tag/` directory. Each tag file should contain a list of tasks that will be inserted when the tag is referenced.

### Tag File Structure

Each tag file follows this format:

```markdown
# tag-name

## Steps
- First step to perform
- Second step to perform
- ...additional steps
```

### Example Tag File

Example tag file (`/templates/tag/unit-test.md`):

```markdown
# unit-test

## Steps
- Write failing unit tests for the functionality
- Run the unit tests and verify they fail for the expected reason
- Implement the functionality
- Run unit tests and verify they now pass
- Make sure test coverage meets project requirements
```

## Using Tags

To use a tag in a task, prefix it with a `#` character at the end of the task description:

```bash
# Add a task with a tag
issue-cards add-task "Implement authentication system #unit-test"

# Create an issue with tagged tasks
issue-cards create feature --title "User authentication" --task "Create User model #unit-test"
```

When you view a task with tags using `issue-cards current`, the tag expands to show all steps:

```
TASK: Implement authentication system #unit-test

STEPS:
1. Write failing unit tests for the functionality
2. Run the unit tests and verify they fail for the expected reason
3. Implement authentication system
4. Run unit tests and verify they now pass
5. Make sure test coverage meets project requirements
```

## Built-in Tags

issue-cards comes with several built-in tags:

### unit-test

Standard unit testing process following Test-Driven Development (TDD) principles:

```markdown
- Write failing unit tests for the functionality
- Run the unit tests and verify they fail for the expected reason
- [ACTUAL TASK GOES HERE]
- Run unit tests and verify they now pass
- Make sure test coverage meets project requirements
```

### e2e-test

End-to-end testing process for verifying functionality in a complete system context:

```markdown
- Write failing end-to-end test that verifies the expected behavior
- Run the test and verify it fails correctly
- [ACTUAL TASK GOES HERE]
- Run the end-to-end test and verify it passes
- Verify the feature works in the full application context
```

### lint-and-commit

Linting and committing process to ensure code quality:

```markdown
- [ACTUAL TASK GOES HERE]
- Run the project's linter and fix any issues
- Run the code formatter
- Commit your changes with a descriptive message
```

### update-docs

Documentation update process:

```markdown
- [ACTUAL TASK GOES HERE]
- Update relevant documentation to reflect changes
- Update comments in the code
- If API changes were made, update API documentation
```

## Using Multiple Tags

You can combine multiple tags on a single task by separating them with spaces:

```bash
issue-cards add-task "Implement login form #unit-test #update-docs"
```

This will expand to include steps from both tags when viewing the task.

## Creating Custom Tags

To create a custom tag:

1. Create a new markdown file in `/templates/tag/` directory
2. Name it appropriately (e.g., `my-tag.md`)
3. Add the tag name as a heading
4. Include a "Steps" section with a list of steps (one per line, prefixed with `-`)
5. Add `[ACTUAL TASK GOES HERE]` placeholder where the original task description should appear
6. Use it with `#my-tag` in your tasks

### Example Custom Tag

```markdown
# code-review

## Steps
- Create a pull request for the changes
- [ACTUAL TASK GOES HERE]
- Request review from at least two team members
- Address all review comments
- Ensure all CI checks pass
- Merge the pull request
```

## Tag Expansion Rules

1. Tags are only expanded when viewing a task, not in the stored task text
2. The original task is inserted at the placeholder location in the tag
3. If no placeholder exists, the original task appears at the beginning
4. Multiple tags are applied in the order they appear in the task
5. Tag expansions do not permanently modify the issue file

## Tag System Implementation

The tag system works by:

1. Parsing task text to identify tag references (`#tag-name`)
2. Looking up each tag in the templates directory
3. Merging the tag steps with the original task
4. Displaying the expanded steps when viewing tasks

## Troubleshooting

If a tag isn't expanding properly:

1. Check that the tag file exists in the correct location
2. Verify the tag name matches exactly (case-sensitive)
3. Make sure the tag is at the end of the task text
4. Check that the tag file follows the correct format

## Related Topics

- [Task Management Tutorial](../tutorials/task-management.md) - Deep dive into task management
- [Templates Reference](templates.md) - Template structure and variables
- [Templates Customization Guide](../guides/templates-customization.md) - Create custom templates
- [Basic Workflow Tutorial](../tutorials/basic-workflow.md) - Essential issue-cards workflows