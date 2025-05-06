# Quick Start Guide

This guide will get you up and running with Issue Cards in minutes.

## Installation

```bash
# Install globally
npm install -g issue-cards

# Or run directly with npx
npx issue-cards [command]

# Verify installation
issue-cards --version
```

## Initialize Issue Tracking

In your project directory:

```bash
# Create the issue tracking structure
issue-cards init
```

This creates:
- `.issues/` directory to store all issues and configuration
- Pre-loaded templates for issues and tags
- Directory structure for tracking open and closed issues

## Create Your First Issue

```bash
# Create a feature issue
issue-cards create feature --title "Add user authentication" \
  --problem "Users need to log in securely to access their data." \
  --task "Create user model" \
  --task "Implement login endpoint" \
  --task "Add authentication middleware"
```

## View Current Task

```bash
# See what to work on
issue-cards current
```

This shows:
- Current task with details
- Context from the issue
- Upcoming tasks

## Complete Tasks

After finishing a task:

```bash
# Mark current task as complete
issue-cards complete-task

# Alternatively, use the shorter alias
issue-cards complete
```

## Document Your Work

While working on tasks:

```bash
# Add notes about your implementation
issue-cards add-note "Using bcrypt for password hashing"

# Log approaches that didn't work
issue-cards log-failure "Tried using localStorage for tokens"

# Ask questions that need answers
issue-cards add-question "What should the token expiration time be?"

# Add new tasks you discovered
issue-cards add-task "Add password reset functionality"
```

## Manage Multiple Issues

```bash
# List all open issues
issue-cards list

# Show details of an issue
issue-cards show -i 1

# Switch to a different issue
issue-cards set-current -i 2
```

## Core Workflow Summary

The basic Issue Cards workflow consists of:

1. **Create an issue** to track a feature, bug, or task
2. **View your current task** to see what to work on
3. **Document your work** with notes, questions, and failure logs
4. **Complete tasks** as you work through them
5. **Manage multiple issues** when working on several things in parallel

## Next Steps

- Explore [Workflows](workflows.md) for more usage patterns
- For AI integration, see [AI Integration Guide](ai-integration.md)
- For team collaboration, see [Task Management](task-management.md)
- Run `issue-cards --help` for command details

For detailed command help, use:
```bash
issue-cards <command> --help
```