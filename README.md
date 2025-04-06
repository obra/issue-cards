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
- **AI Integration**: Built-in MCP (Model-Code-Prompt) server for direct AI assistant integration
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

For comprehensive command documentation:

```bash
# Get help on any command
issue-cards <command> --help

# Browse documentation by category
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

For complete configuration references:
- [Environment Variables Reference](docs/reference/environment-vars.md)
- [Output Format Reference](docs/reference/output-formats.md)

## AI Integration

Issue Cards provides a Model-Code-Prompt (MCP) API for AI assistant integration:

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
- [AI Integration Guide](docs/guides/ai-integration.md)
- [AI Integration Reference](docs/reference/ai-integration.md)
- [MCP Server Configuration](docs/reference/mcp-server-config.md)

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

Learn more in the [Tag Expansion Reference](docs/reference/tag-expansion.md).

### Git Integration

When working in a Git repository, issue-cards automatically stages changes to issue files when you:
- Complete tasks
- Add notes or questions
- Log failed approaches

See the [Git Integration Guide](docs/guides/git-integration.md) for details.

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

### Documentation Categories

- [Getting Started Guide](docs/getting-started.md) - Quick introduction for new users
- [Tutorials](docs/tutorials/index.md) - Step-by-step learning materials
  - [Basic Workflow](docs/tutorials/basic-workflow.md) - Essential workflows
  - [Task Management](docs/tutorials/task-management.md) - Working with tasks
  - [Advanced Features](docs/tutorials/advanced-features.md) - Power user features
  - [Project Planning](docs/tutorials/project-planning.md) - Planning with issue-cards
- [Guides](docs/guides/index.md) - How-to guides for specific tasks
  - [Git Integration](docs/guides/git-integration.md) - Using with Git
  - [Templates Customization](docs/guides/templates-customization.md) - Creating custom templates
  - [AI Integration](docs/guides/ai-integration.md) - Working with AI tools
  - [Common Workflows](docs/guides/common-workflows.md) - Example-driven workflows
- [Reference Documentation](docs/reference/index.md) - Technical specifications
  - [Environment Variables](docs/reference/environment-vars.md) - Configuration
  - [Tag Expansion](docs/reference/tag-expansion.md) - How tags work
  - [AI Integration Reference](docs/reference/ai-integration.md) - AI details
- [Design Decisions](docs/design/index.md) - Background on architecture choices

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)