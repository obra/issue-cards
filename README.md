# Issue Cards

Issue Cards is an AI-optimized command-line issue tracking tool designed for AI coding agents and human developers. It manages tasks efficiently through a lightweight, markdown-based system that lives directly in your project repository.

## Key Features

- **Simple File-Based Storage**: All issues are stored as markdown files directly in your project
- **Linear Task Sequencing**: Tasks are presented in a clear, sequential order
- **Tag-Based Task Expansion**: Apply common patterns like testing requirements with simple tags
- **Context-Rich Display**: Each task shows all the context needed to implement it
- **Git Integration**: Automatically stages issue updates when using git
- **AI-Friendly Output**: Standardized command output format for easy parsing

## Installation

```bash
npm install -g issue-cards
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

## Documentation

For full documentation on all commands and features, see the [spec.md](spec.md) file.

## License

MIT