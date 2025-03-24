# Issue Cards

Issue Cards is an AI-optimized command-line issue tracking tool designed for both AI coding agents and human developers. It manages tasks efficiently through a lightweight, markdown-based system that lives directly in your project repository.

<p align="center">
  <img src="https://github.com/issue-cards/issue-cards/raw/main/docs/logo.png" alt="Issue Cards Logo" width="300">
</p>

## Features

- **Simple File-Based Storage**: All issues are stored as markdown files directly in your project
- **Linear Task Sequencing**: Tasks are presented in a clear, sequential order
- **Tag-Based Task Expansion**: Apply common patterns like testing requirements with simple tags
- **Context-Rich Display**: Each task shows all the context needed to implement it
- **Git Integration**: Automatically stages issue updates when using git
- **AI-Friendly Output**: Standardized command output format for easy parsing by AI agents
- **Configurable**: Customize directories and behavior through environment variables

## Installation

```bash
# Install globally
npm install -g issue-cards

# Or use with npx
npx issue-cards <command>
```

## Quick Start

```bash
# Initialize issue tracking in your project
issue-cards init

# Create a new feature issue
issue-cards create feature --title "Add search functionality"

# View your current task
issue-cards current

# Mark the current task as complete when done
issue-cards complete-task

# List all open issues
issue-cards list
```

## Commands

### Core Workflow

- `issue-cards init` - Set up issue tracking in your project
- `issue-cards create <template> --title <title>` - Create a new issue
- `issue-cards list` - Show all open issues
- `issue-cards current` - Show current task with context
- `issue-cards complete-task` - Mark current task as complete and show next
- `issue-cards show [issue-number]` - Show issue details

### Task Management

- `issue-cards add-task <description> [--before|--after] [--tags "tag1,tag2"]` - Add a new task
- `issue-cards add-note <note>` - Add a note to the current issue
- `issue-cards log-failure <description>` - Log a failed approach
- `issue-cards add-question <question>` - Add a question to resolve

### Templates

- `issue-cards templates` - List available templates
- `issue-cards templates <name>` - Show specific template details

## Issue Structure

Each issue contains:

- Title and issue number
- Problem description
- Planned approach
- Failed approaches (for logging attempts that didn't work)
- Questions to resolve
- Task list with sequential steps
- Instructions for implementation
- Next steps (optional preview of upcoming work)

## Configuration

Issue Cards can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ISSUE_CARDS_DIR` | Directory to store issues and templates | `.issues` in current working directory |

Example:

```bash
# Use a custom directory for issues
export ISSUE_CARDS_DIR=/path/to/custom/issues
issue-cards init
```

## Issue Example

```markdown
# Issue 0001: Implement user authentication

## Problem to be solved
Users need to be able to securely log into the application.

## Planned approach
Use JWT tokens with secure cookie storage and implement proper password hashing.

## Failed approaches
- Tried using localStorage for token storage but found security vulnerabilities

## Questions to resolve
- What is the token expiration time?

## Tasks
- [ ] Create user model with password field #unit-test
- [ ] Implement password hashing and verification
- [ ] Create login endpoint #e2e-test
- [ ] Add JWT token generation
- [ ] Implement authentication middleware #unit-test

## Instructions
Follow the project's security guidelines when implementing authentication.
The JWT should include the user's role permissions.

## Next steps
Once authentication is complete, we'll implement:
- Authorization middleware for protected routes
- User profile management
```

## Task Tags

Tags apply common patterns to tasks and expand them with pre-defined steps:

```bash
# Example of creating a task with a tag
issue-cards add-task "Implement login form" --tags "unit-test,e2e-test"

# When you run "issue-cards current", the task will be expanded:
# 1. Write failing unit tests...
# 2. Run tests and verify they fail...
# 3. Implement login form
# 4. Run tests to verify they pass...
# 5. Write failing end-to-end test...
# ...etc.
```

Built-in tags:
- `unit-test` - Wraps a task with unit testing steps
- `e2e-test` - Wraps a task with end-to-end testing steps
- `lint-and-commit` - Adds linting and formatting steps
- `update-docs` - Adds documentation update steps

## Git Integration

When working in a git repository, Issue Cards automatically stages changes to issue files:

```bash
# When you mark a task as complete
issue-cards complete-task
# Issue file is updated and automatically staged with git

# When you add a note or log a failure
issue-cards log-failure "Tried method X but it didn't work"
# Issue file is updated and automatically staged with git
```

## Examples

### Creating an Issue

Simple creation:
```bash
issue-cards create feature --title "Add user authentication"
```

Complete creation with all sections:
```bash
issue-cards create feature \
  --title "Add user authentication" \
  --problem "Users need to securely log in to access their content." \
  --approach "We'll implement JWT-based authentication with secure cookies." \
  --tasks "Create User model #unit-test
Create login endpoint #e2e-test
Add JWT token generation
Implement auth middleware" \
  --instructions "Follow OWASP security guidelines."
```

### Working with Current Task

```bash
# Show current task with context
issue-cards current

# Mark current task complete and see next task
issue-cards complete-task
```

### Adding Notes and Tracking Progress

```bash
# Add a note (auto-categorized based on content)
issue-cards add-note "We should consider adding rate limiting to the login endpoint"

# Log a failed approach
issue-cards log-failure "Tried using localStorage but it was vulnerable to XSS"

# Add a question
issue-cards add-question "What should be the token expiration time?"
```

## Documentation

For detailed documentation and more examples, see:

- [Detailed Command Reference](docs/commands.md)
- [Issue and Tag Templates](docs/templates.md)
- [Example Workflows](docs/workflows.md)
- [Integration with AI Tools](docs/ai-integration.md)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)