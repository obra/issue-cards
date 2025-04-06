# Templates Customization Guide

This guide explains how to customize issue and tag templates in issue-cards.

## Issue Templates

Issue templates define the structure and initial content of new issues.

### Default Templates

issue-cards comes with several built-in issue templates:

- `feature` - For implementing new features
- `bugfix` - For fixing bugs
- `refactor` - For code improvement without changing functionality
- `audit` - For security and performance review

### Template Location

Templates are stored in the `/templates/issue/` directory. Each template is a markdown file.

### Template Structure

Issue templates use a standard structure:

```markdown
# {{title}}

## Problem
{{problem}}

## Approach
{{approach}}

## Failed Approaches
{{failedApproaches}}

## Questions
{{questions}}

## Tasks
{{tasks}}

## Instructions
{{instructions}}
```

### Creating Custom Templates

To create a custom template:

1. Create a new markdown file in `/templates/issue/` directory
2. Name it appropriately (e.g., `my-template.md`)
3. Add the desired sections and placeholder variables
4. Use it with `issue-cards create my-template --title "Issue Title"`

Example custom template:

```markdown
# {{title}}

## User Story
As a {{userRole}}, I want to {{userWant}} so that {{userBenefit}}.

## Acceptance Criteria
{{acceptanceCriteria}}

## Tasks
{{tasks}}
```

## Tag Templates

Tag templates define reusable task sequences that can be expanded when referenced with a `#` symbol.

### Default Tags

issue-cards comes with several built-in tags:

- `#unit-test` - Standard unit testing process
- `#e2e-test` - End-to-end testing process
- `#lint-and-commit` - Linting and committing process
- `#update-docs` - Documentation update process

### Tag Location

Tags are stored in the `/templates/tag/` directory. Each tag is a markdown file.

### Tag Structure

Tag templates are simple lists of tasks:

```markdown
- First task
- Second task
- Third task
```

### Creating Custom Tags

To create a custom tag:

1. Create a new markdown file in `/templates/tag/` directory
2. Name it appropriately (e.g., `my-tag.md`)
3. Add a list of subtasks (one per line, prefixed with `-`)
4. Use it with `#my-tag` in your tasks

Example custom tag:

```markdown
- Design component structure
- Implement component
- Add styling
- Write unit tests
- Document props and usage
```

## Template Variables

Templates support several variables that are replaced at creation time:

- `{{title}}` - Issue title
- `{{problem}}` - Problem description
- `{{approach}}` - Planned approach
- `{{failedApproaches}}` - Approaches already tried
- `{{questions}}` - Questions that need answers
- `{{tasks}}` - Tasks to complete
- `{{instructions}}` - Implementation guidelines

Custom variables can be provided with the `--var` option:

```bash
issue-cards create my-template --title "New Feature" --var userRole="admin" --var userWant="manage users" --var userBenefit="can control access"
```

## Related Topics

- [Reference: Templates](../reference/templates.md)
- [Basic Workflow](../tutorials/basic-workflow.md)
- [Task Tag Expansion](../reference/tag-expansion.md)