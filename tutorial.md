# Issue Cards Tutorial

This tutorial provides detailed examples and explanations for using Issue Cards. For a quick overview, see the [README](README.md).

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Basic Workflow](#basic-workflow)
3. [Advanced Features](#advanced-features)
4. [Tag System](#tag-system)
5. [Context and Output](#context-and-output)

## Core Concepts

Issue Cards organizes work around three main concepts:

### Issues

Self-contained units of work stored as markdown files. Each issue has:
- A unique number (0001, 0002, etc.)
- Structured sections (Problem, Approach, Tasks, etc.)
- Moves from open/ to closed/ when completed

### Tasks

Linear sequence of work items within an issue:
- Markdown task syntax (`- [ ]` for incomplete, `- [x]` for complete)
- Strictly ordered (first uncompleted task is "current")
- Can have tags for additional required steps

### Tags

Predefined wrappers that add standard steps to tasks:
- Apply patterns like testing requirements
- Automatically expand when viewing tasks
- Don't alter the original issue file
- Examples: unit-test, e2e-test, lint-and-commit

## Basic Workflow

### 1. Creating Issues

```bash
# Create a simple issue with just a title
issue-cards create feature --title "Add user authentication"

# Create a comprehensive issue with all sections
issue-cards create feature \
  --title "Add user authentication" \
  --problem "Users need to securely log in." \
  --approach "We'll use JWT tokens with secure cookies." \
  --task "Create User model #unit-test" \
  --task "Create login API endpoint #e2e-test" \
  --task "Add authentication middleware" \
  --instructions "Follow OWASP security guidelines."
```

### 2. Viewing Issues

```bash
# List all open issues
issue-cards list

# Show details of a specific issue
issue-cards show 1

# Show current issue (if no number specified)
issue-cards show
```

### 3. Working with Tasks

```bash
# Show current task with context
issue-cards current

# Mark current task as complete and see next task
issue-cards complete-task

# Add a new task after current task
issue-cards add-task "Implement password reset"

# Add a new task before current task
issue-cards add-task "Set up database connection" --before

# Add a tagged task
issue-cards add-task "Add email validation" --tags "unit-test"
```

### 4. Documentation and Context

```bash
# Add a question to the current issue
issue-cards add-question "What should be the token expiration time?"

# Log a failed approach
issue-cards log-failure "Tried using localStorage but had security issues"

# Add a general note (automatically goes to appropriate section)
issue-cards add-note "We should consider using Redis for session storage"
```

## Advanced Features

### Templates Management

```bash
# List available templates with usage examples
issue-cards templates

# View details of a specific template
issue-cards templates feature
```

### Git Integration

If your project uses Git, Issue Cards automatically stages changes to issue files when you:
- Create or edit issues
- Complete tasks
- Add notes, questions, or failed approaches

## Tag System

Tags add standardized steps to tasks without modifying the original issue file.

### Available Tags

- **unit-test**: Wraps task with unit testing steps
- **e2e-test**: Wraps task with end-to-end testing steps
- **lint-and-commit**: Adds linting and commit steps
- **update-docs**: Adds documentation update steps

### Using Tags

When you add `#tag-name` to a task:

```
- [ ] Create User model #unit-test
```

The task expands to multiple steps when viewed:

```
1. Write failing unit tests for the User model
2. Run tests and verify they fail as expected
3. Create User model
4. Run tests and verify they pass
5. Ensure test coverage meets requirements
```

## Context and Output

Issue Cards optimizes output for both humans and AI agents:

### Current Task Context

When running `issue-cards current`, you get:
- The current task description
- Relevant context from the issue (Problem, Instructions)
- Failed approaches to avoid repeating mistakes
- Questions that need answers
- Expanded steps for any tagged tasks
- Preview of upcoming tasks

### Example Output

```
COMMAND: issue-cards current

TASK: Create User model #unit-test

CONTEXT:
Problem to be solved:
Users need to securely log in to access their personalized content.

Failed approaches:
- Tried using localStorage but it was vulnerable to XSS attacks

Instructions:
Follow OWASP security guidelines. Include CSRF protection.

TASKS:
1. Write failing unit tests for the User model
2. Run the tests and verify they fail for the expected reason
3. Create User model
4. Run the unit tests and verify they now pass
5. Make sure test coverage meets project requirements

UPCOMING TASKS:
- Create login API endpoint #e2e-test
- Add authentication middleware

Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.
```


## Related Documentation

For more detailed information about specific aspects of Issue Cards, refer to the documentation in the `docs/` directory:

- [Getting Started Guide](docs/guides/getting-started.md)
- [Complete Tutorials](docs/tutorials/index.md)
- [Command Reference](docs/reference/commands.md)
- [Tag Expansion Reference](docs/reference/tag-expansion.md)
- [Templates Customization Guide](docs/guides/templates-customization.md)