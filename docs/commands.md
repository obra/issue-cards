# Issue Cards Command Reference

This document provides detailed information on all available commands in the Issue Cards CLI tool.

## Table of Contents

- [Installation](#installation)
- [Core Commands](#core-commands)
  - [init](#init)
  - [create](#create)
  - [list](#list)
  - [show](#show)
  - [current](#current)
  - [set-current](#set-current)
  - [complete-task](#complete-task)
- [Task Management Commands](#task-management-commands)
  - [add-task](#add-task)
  - [add-note](#add-note)
  - [log-failure](#log-failure)
  - [add-question](#add-question)
- [Template Commands](#template-commands)
  - [templates](#templates)
- [AI Integration Commands](#ai-integration-commands)
  - [serve](#serve)
- [Global Options](#global-options)

## Installation

```bash
# Install globally
npm install -g issue-cards

# Or use with npx for one-time use
npx issue-cards <command>
```

## Core Commands

### init

Initializes the issue tracking system in your project.

```bash
issue-cards init
```

Creates:
- `.issues/` directory to store all issues and configuration
- Pre-loaded templates for issues and tags
- Directory structure for tracking open and closed issues

Example output:
```
✅ Initialized issue tracking system in .issues/
✅ Created config templates
✅ Ready to create your first issue
```

### create

Creates a new issue from a template.

```bash
issue-cards create <template> --title <title> [options]
```

Arguments:
- `template` - Template type to use (feature, bugfix, refactor, audit)

Required options:
- `--title` - Issue title

Optional sections:
- `--problem` - Description of the problem to solve
- `--approach` - High-level strategy for solving the issue
- `--failed-approaches` - List of approaches already tried (one item per line)
- `--questions` - Questions that need answers (one item per line)
- `--task` - A task to add to the issue (can be specified multiple times), can include #tags
- `--instructions` - Guidelines to follow during implementation
- `--next-steps` - Future work after this issue (one item per line)

Examples:
```bash
# Simple creation with just a title
issue-cards create feature --title "Add search functionality"

# Complete creation with all sections
issue-cards create bugfix \
  --title "Fix login redirect issue" \
  --problem "After login, users are not redirected to the page they were viewing." \
  --approach "Store the original URL in session storage before redirect." \
  --failed-approaches "Tried using URL parameters but it broke for complex URLs." \
  --questions "Should we handle deep linking to protected pages?" \
  --task "Reproduce the issue with a test #unit-test" \
  --task "Add URL storage before login redirect" \
  --task "Implement redirect after successful login" \
  --task "Add error handling for invalid URLs" \
  --instructions "Use sessionStorage rather than localStorage for security." \
  --next-steps "Consider implementing a more robust auth flow."
```

### list

Lists all open issues.

```bash
issue-cards list
```

Example output:
```
Open Issues:
  ⚡ #0001: Add user authentication (current)
    Current task: Create User model with password field
  
  #0002: Fix password reset email not sending
    Current task: Reproduce the bug with test case
  
  #0003: Refactor API error handling
    Current task: Create consistent error response structure

Total: 3 open issues
```

### show

Shows details of an issue.

```bash
issue-cards show [options]
```

Options:
- `-i, --issue <number>` - Issue number to show (if omitted, shows the current issue)

Examples:
```bash
# Show a specific issue
issue-cards show --issue 0001

# Show a specific issue with the short option
issue-cards show -i 0001

# Show the current issue
issue-cards show
```

Example output:
```
# Issue 0001: Add user authentication

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

### current

Shows the current task with context.

```bash
issue-cards current
```

Example output:
```
CURRENT TASK:
Create user model with password field +unit-test

CONTEXT:

Problem to be solved:
Users need to be able to securely log into the application.

Failed approaches:
- Tried using localStorage for token storage but found security vulnerabilities

Instructions:
Follow the project's security guidelines when implementing authentication.
The JWT should include the user's role permissions.

UPCOMING TASKS:
- Implement password hashing and verification
- Create login endpoint +e2e-test
- Add JWT token generation
- Implement authentication middleware +unit-test

Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.
```

### set-current

Sets a specific issue as the current issue.

```bash
issue-cards set-current <issue>
```

Arguments:
- `issue` - The issue number to set as current

Example output:
```
✅ Issue #0002 is now current
```

When trying to set a non-existent issue:
```
❌ Issue #9999 not found
```

### complete-task

Marks the current task as complete and shows the next task.

```bash
issue-cards complete-task
```

Example output:
```
✅ Completed: Create user model with password field

CURRENT TASK:
Implement password hashing and verification

CONTEXT:

Problem to be solved:
Users need to be able to securely log into the application.

Failed approaches:
- Tried using localStorage for token storage but found security vulnerabilities

Instructions:
Follow the project's security guidelines when implementing authentication.
The JWT should include the user's role permissions.

UPCOMING TASKS:
- Create login endpoint +e2e-test
- Add JWT token generation
- Implement authentication middleware +unit-test

Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.
```

When all tasks are complete:
```
✅ Completed: Implement authentication middleware
🎉 All tasks complete! Issue #0001 has been closed.

Would you like to work on another issue? Run:
  issue-cards list
```

## Task Management Commands

### add-task

Adds a new task to an issue.

```bash
issue-cards add-task [options] <task-text>
```

Arguments:
- `task-text` - Text of the task to add

Options:
- `-i, --issue <id>` - Issue ID to add task to (defaults to first open issue)
- `-b, --before` - Add task before the current task
- `-a, --after` - Add task after the current task

Examples:
```bash
# Add a task to the current issue
issue-cards add-task "Add email verification support"

# Add a task to a specific issue
issue-cards add-task -i 2 "Implement password reset functionality"

# Add a task before the current task
issue-cards add-task --before "Set up database connection"

# Add a task with expansion tags
issue-cards add-task "Create login form component +unit-test +update-docs"
```

### add-note

Adds a note to a specific section of an issue.

```bash
issue-cards add-note [options] <note>
```

Arguments:
- `note` - The note text to add

Options:
- `-i, --issue <number>` - Issue number (uses current issue if not specified)
- `-s, --section <name>` - Section to add note to (problem, approach, failed-approaches, etc.), defaults to 'problem'
- `-f, --format <type>` - Note format (question, failure, task, or blank for normal note)
- `-r, --reason <text>` - Reason for a failed approach (used with --format=failure)

Examples:
```bash
# Add a note to the current issue's problem section
issue-cards add-note "We should use bcrypt with 10 rounds for password hashing"

# Add a note to a specific issue's approach section
issue-cards add-note -i 2 -s approach "We should use bcrypt with 10 rounds for password hashing"

# Add a formatted note with a specific section
issue-cards add-note -i 3 -s failed-approaches -f failure -r "Security vulnerability" "Tried using localStorage"
```

### log-failure

Logs a failed approach to the Failed approaches section of an issue.

```bash
issue-cards log-failure [options] <approach>
```

Arguments:
- `approach` - Description of the failed approach

Options:
- `-i, --issue <number>` - Issue number (uses current issue if not specified)
- `-r, --reason <text>` - Reason for the failure, defaults to "Not specified"

Example:
```bash
# Log a failure to the current issue
issue-cards log-failure "Tried using the bcrypt implementation from crypto-js but it was too slow for our needs"

# Log a failure with a reason to a specific issue
issue-cards log-failure -i 5 -r "Performance degradation" "Tried using the bcrypt implementation from crypto-js"
```

### add-question

Adds a question to the Questions to resolve section of an issue.

```bash
issue-cards add-question [options] <question>
```

Arguments:
- `question` - The question to add

Options:
- `-i, --issue <number>` - Issue number (uses current issue if not specified)

Example:
```bash
# Add a question to the current issue
issue-cards add-question "What should be the password reset token expiration time?"

# Add a question to a specific issue
issue-cards add-question -i 3 "Should we implement rate limiting for failed login attempts?"
```

## Template Commands

### templates

Lists available templates or shows details of a specific template.

```bash
issue-cards templates [name] [options]
```

Arguments:
- `name` - (Optional) Name of the template to show details for

Options:
- `--type <type>` - Type of templates to list (issue or tag)
- `--validate` - Validate template structure and show validation results

Examples:
```bash
# List all templates
issue-cards templates

# Show details of a specific template
issue-cards templates feature

# List templates with validation check
issue-cards templates --validate

# Show specific template type
issue-cards templates --type tag
```

## AI Integration Commands

### serve

Starts the MCP (Model-Code-Prompt) server for AI integration.

```bash
issue-cards serve [options]
```

Options:
- `--port`, `-p` - Port to listen on (default: 3000)
- `--host`, `-h` - Host to bind to (default: localhost)
- `--token`, `-t` - Authentication token for API access
- `--no-auth` - Disable authentication (not recommended for production)

Examples:
```bash
# Start server with default settings
issue-cards serve

# Start server on custom port
issue-cards serve -p 8080

# Start server with authentication token
issue-cards serve -t your-api-token

# Start server binding to all interfaces
issue-cards serve -h 0.0.0.0
```

The MCP server exposes the following API endpoints:
- `GET /api/health` - Check server health
- `GET /api/status` - Get server status and available tools
- `GET /api/tools` - List all available MCP tools
- `GET /api/tools/:name` - Get details for a specific tool
- `POST /api/tools/execute` - Execute an MCP tool

For detailed documentation on using the MCP server with AI models, see [AI Integration](ai-integration.md).

## Global Options

These options are available on all commands:

- `--help` - Shows help for a command
- `--version` - Shows version information

Examples:
```bash
# Show help for a specific command
issue-cards create --help

# Show version
issue-cards --version
```