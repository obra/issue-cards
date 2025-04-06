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

## Commands

### Core Workflow

- `issue-cards init` - Set up issue tracking in your project
- `issue-cards create <template> --title <title>` - Create a new issue
- `issue-cards list` - Show all open issues
- `issue-cards current` - Show current task with context
- `issue-cards complete-task` (or `complete`) - Mark current task as complete and show next
- `issue-cards show [issue-number]` - Show issue details

### Task Management

- `issue-cards add-task` (or `add`) `<description> [--before|--after] [--tags "tag1,tag2"]` - Add a new task
- `issue-cards add-note <note>` - Add a plain text note to the current issue
- `issue-cards log-failure` (or `failure`) `<description>` - Log a failed approach
- `issue-cards add-question` (or `question`) `<question>` - Add a question to resolve

### Templates

- `issue-cards templates` - List available templates
- `issue-cards templates <name>` - Show specific template details

### AI Integration

- `issue-cards serve [--port 3000] [--token secret]` - Start MCP server for AI integration
- `issue-cards serve --host 0.0.0.0` - Start server and bind to all interfaces
- `issue-cards serve --no-auth` - Start server without authentication (for local development)

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

### Environment Variables

Issue Cards can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ISSUE_CARDS_DIR` | Directory to store issues and templates | `.issues` in current working directory |
| `ISSUE_CARDS_MCP_PORT` | Port for the MCP server | `3000` |
| `ISSUE_CARDS_MCP_HOST` | Host to bind the MCP server to | `localhost` |
| `ISSUE_CARDS_MCP_TOKEN` | Authentication token for MCP server | None (auth disabled) |
| `ISSUE_CARDS_MCP_CORS` | Enable CORS for MCP server | `false` |

Example:

```bash
# Use a custom directory for issues
export ISSUE_CARDS_DIR=/path/to/custom/issues
issue-cards init

# Start MCP server with custom port and authentication
ISSUE_CARDS_MCP_PORT=8080 ISSUE_CARDS_MCP_TOKEN=secure-token issue-cards serve
```

For a complete reference of all environment variables and advanced configuration options, see the [Environment Variables Documentation](docs/reference/environment-vars.md).

### Output Options

Issue Cards supports various output formats and verbosity levels:

| Option | Description |
|--------|-------------|
| `--quiet`, `-q` | Minimal output (errors only) |
| `--verbose`, `-v` | Additional detailed output |
| `--debug`, `-d` | Maximum debug information |
| `--no-color` | Disable colored output |
| `--json` | Output in JSON format |

Example:

```bash
# Get machine-parseable JSON output
issue-cards list --json

# Minimal output for scripts
issue-cards complete-task --quiet
```

For more details on output formats, see [Output Format Documentation](docs/reference/output-formats.md).

## AI Integration

Issue Cards provides a powerful Model-Code-Prompt (MCP) API that allows AI assistants to interact with your issues and tasks. This enables seamless collaboration between humans and AI tools like Claude or GPT.

### Starting the MCP Server

```bash
# Start the server with default settings
issue-cards serve

# Start with authentication token (recommended for production)
issue-cards serve --token your-secret-token

# Specify a custom port
issue-cards serve --port 8080
```

### Key Integration Features

- **REST API**: Simple JSON-based API for all issue operations
- **Standardized Tools**: 11 MCP tools covering all issue-cards functionality
- **Authentication**: Optional token-based authentication
- **Detailed Responses**: Consistent response format with rich error handling
- **AI-Optimized**: Designed specifically for integration with AI assistants

This enables AI assistants to:
- Create and manage issues
- Complete tasks and track progress
- Document approaches and attempted solutions
- Record questions and failure causes
- Provide detailed context for implementation

For detailed documentation, see:
- [AI Integration Guide](docs/guides/ai-integration.md)
- [MCP Tool Reference](docs/reference/mcp-tool-reference.md)
- [MCP Server Configuration](docs/reference/mcp-server-config.md)
- [Example Curl Commands](docs/reference/mcp-curl-examples.md)
- [Claude Prompt Examples](docs/claude-prompt-examples.md)

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
issue-cards complete-task  # or issue-cards complete
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
  --task "Create User model #unit-test" \
  --task "Create login endpoint #e2e-test" \
  --task "Add JWT token generation" \
  --task "Implement auth middleware" \
  --instructions "Follow OWASP security guidelines."
```

### Working with Current Task

```bash
# Show current task with context
issue-cards current

# Mark current task complete and see next task
issue-cards complete-task  # or the shorter alias: issue-cards complete
```

### Adding Notes and Tracking Progress

```bash
# Add a note (auto-categorized based on content)
issue-cards add-note "We should consider adding rate limiting to the login endpoint"

# Log a failed approach
issue-cards log-failure "Tried using localStorage but it was vulnerable to XSS"
# Or use the shorter alias
issue-cards failure "Tried using localStorage but it was vulnerable to XSS"

# Add a question
issue-cards add-question "What should be the token expiration time?"
# Or use the shorter alias
issue-cards question "What should be the token expiration time?"
```

## Documentation

For detailed documentation and more examples, see:

- [Getting Started](docs/getting-started.md)
- [Tutorials](docs/tutorials/index.md)
- [Guides](docs/guides/index.md)
- [Reference Documentation](docs/reference/index.md)
- [Design Decisions](docs/design/index.md)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)