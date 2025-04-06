# Getting Started with Issue Cards

This guide will help you get up and running with Issue Cards quickly.

## Installation

```bash
# Install globally via npm
npm install -g issue-cards

# Or run directly with npx
npx issue-cards [command]
```

## Basic Setup

To start using Issue Cards in your project:

```bash
# Initialize issue tracking in your project
issue-cards init
```

This creates:
- `.issues/` directory to store all issues and configuration
- Pre-loaded templates for issues and tags
- Directory structure for tracking open and closed issues

## Core Workflow

1. **Create an issue**:
   ```bash
   issue-cards create feature --title "Add search functionality"
   ```

2. **View your current task**:
   ```bash
   issue-cards current
   ```

3. **Complete a task**:
   ```bash
   issue-cards complete-task
   ```

4. **List all issues**:
   ```bash
   issue-cards list
   ```

## Next Steps

Once you've mastered the basics, explore these topics:

- [Basic Workflow](tutorials/basic-workflow.md)
- [Command Reference](commands.md)
- [Environment Variables](reference/environment-vars.md)

For detailed command help, use:
```bash
issue-cards <command> --help
```