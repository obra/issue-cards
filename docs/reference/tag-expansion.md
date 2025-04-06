# Task Tag Expansion System

This document explains how the tag expansion system works in issue-cards.

## Overview

The tag expansion system allows you to define reusable task sequences as "tags" that can be expanded into multiple tasks when referenced.

## Tag Definition

Tags are defined in markdown files in the `/templates/tag/` directory. Each tag file should contain a list of tasks that will be inserted when the tag is referenced.

Example tag file (`/templates/tag/unit-test.md`):

```markdown
- Write test cases for normal operation
- Write test cases for edge cases
- Write test cases for error conditions
- Ensure test coverage is adequate
```

## Using Tags

To use a tag in a task, prefix it with a `#` character:

```bash
issue-cards add-task "Implement authentication system #unit-test"
```

This will expand to create multiple tasks:

```
- Implement authentication system
  - Write test cases for normal operation
  - Write test cases for edge cases
  - Write test cases for error conditions
  - Ensure test coverage is adequate
```

## Built-in Tags

issue-cards comes with several built-in tags:

- `#unit-test` - Standard unit testing process
- `#e2e-test` - End-to-end testing process
- `#lint-and-commit` - Linting and committing process
- `#update-docs` - Documentation update process

## Creating Custom Tags

To create a custom tag:

1. Create a new markdown file in `/templates/tag/` directory
2. Name it appropriately (e.g., `my-tag.md`)
3. Add a list of subtasks (one per line, prefixed with `-`)
4. Use it with `#my-tag` in your tasks

## Related Topics

- [Task Management](../tutorials/task-management.md)
- [Templates Customization](../guides/templates-customization.md)