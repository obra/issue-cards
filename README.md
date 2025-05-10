# Issue Cards

Issue Cards is an AI-optimized command-line issue tracking tool designed for both AI coding agents and human developers. (But primarily for keeping your coding agent on-task)

** Caveat Emptor: Pretty much every part of this was built using Claude Code, but I have actually used it for a couple of projects and it seems to do a good job of keeping the coding agent on task. **

I owe a blog post about how to use it. -Jesse, April 2025


## Features

- **Simple File-Based Storage**: All issues are stored as markdown files directly in your project
- **Linear Task Sequencing**: Tasks are presented in a clear, sequential order
- **Tag-Based Task Expansion**: Apply common patterns like testing requirements with simple tags
- **Context-Rich Display**: Each task shows all the context needed to implement it
- **Git Integration**: Automatically stages issue updates when using git
- **AI Integration**: Built-in MCP server for direct AI assistant integration
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

## Key Commands

Here are the most essential commands to get started:

```bash
# Setup and issue creation
issue-cards init                         # Initialize issue tracking
issue-cards create feature --title "..." # Create a new feature issue

# Task workflow
issue-cards current                      # View current task with context
issue-cards complete-task                # Mark task complete & show next
issue-cards add-task "New task"          # Add a new task

# Issue management
issue-cards list                         # List all open issues
issue-cards show 1                       # Show issue details
```

For detailed help on any command or topic:

```bash
# Get help on any command
issue-cards <command> --help

# View environment variables reference
issue-cards help env

# Browse all documentation
issue-cards help
```

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

issue-cards can be customized with environment variables and command-line options:

```bash
# Use a custom directory for issues
export ISSUE_CARDS_DIR=/path/to/custom/issues

# Get machine-parseable JSON output
issue-cards list --json

# Quiet mode for scripts
issue-cards complete-task --quiet
```

For complete configuration references use built-in help:
```bash
# Environment variables reference
issue-cards help env

# Commands reference
issue-cards --help
```

## AI Integration

Issue Cards provides a Model-Code-Prompt (MCP) API for AI assistant integration:

### Claude Code Integration

To use Issue Cards with Claude Code, add one of the following to your configuration:

```
# Using NPX (installs on-demand)
issue-cards: npx issue-cards-mcp-server@latest

# Using globally installed version (if installed with npm install -g issue-cards)
issue-cards: issue-cards-mcp-server
```

This will automatically set up the MCP server for seamless integration with Claude Code.

### Manual Server Setup

You can also start the server manually:

```bash
# Start the MCP server
issue-cards serve

# With authentication (recommended for production)
issue-cards serve --token your-secret-token
```

Enables AI assistants to:
- Create and manage issues
- Complete tasks and track progress
- Document approaches and solutions
- Add context through notes and questions

Documentation:
- [AI Integration Guide](docs/ai-integration.md)

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

## Key Features

### Task Tags

Tasks can be tagged to automatically expand with standardized steps:

```bash
# Add a task with testing tags
issue-cards add-task "Implement login form #unit-test #e2e-test"
```

When viewing the task, it expands to show all required steps:
- Write unit tests, implement feature, verify tests pass
- Follow consistent workflows for different task types

Learn more with `issue-cards help tags`.

### Git Integration

When working in a Git repository, issue-cards automatically stages changes to issue files when you:
- Complete tasks
- Add notes or questions
- Log failed approaches

## Documentation

issue-cards includes a comprehensive documentation system accessible both from the CLI and in markdown files:

### CLI Documentation

Access help directly from the command line:

```bash
# Browse all documentation categories
issue-cards help

# View a specific documentation topic
issue-cards help tutorials/basic-workflow

# Get detailed help for a command
issue-cards create --help
```

### Documentation

The documentation has been streamlined for clarity:

- [Quick Start Guide](docs/quick-start.md) - Essential setup and first issue workflow
- [Common Workflows](docs/workflows.md) - Practical examples of using Issue Cards
- [AI Integration Guide](docs/ai-integration.md) - How to use with AI assistants
- [Contributing Guide](docs/contributing.md) - Information for project contributors

For additional help, run:
```bash
issue-cards help
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)
