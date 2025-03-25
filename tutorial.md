# Issue Cards Tutorial

Issue Cards is an AI-optimized command-line issue tracking tool designed for developers and AI agents to manage tasks efficiently. This tutorial will guide you through using the tool and demonstrate its capabilities.

## Table of Contents

1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [Basic Workflow](#basic-workflow)
5. [Advanced Features](#advanced-features)
6. [Tag System](#tag-system)
7. [Context and Output](#context-and-output)
8. [Tutorial Test Script](#tutorial-test-script)

## Installation

```bash
# Install globally via npm
npm install -g issue-cards

# Or run directly with npx
npx issue-cards [command]
```

## Getting Started

To start using Issue Cards in a project:

```bash
# Initialize issue tracking in your project
issue-cards init

# This creates:
# - .issues/config/ - Contains templates
# - .issues/open/ - Stores open issues
# - .issues/closed/ - Stores completed issues
```

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

## Tutorial Test Script

Below is a test script that demonstrates the complete workflow of Issue Cards. You can run this as a shell script to see the tool in action.

```bash
#!/bin/bash
# Issue Cards Tutorial Test Script

# Set -e to exit on any error
set -e

# Create temporary test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
echo "Created test directory: $TEST_DIR"

# Function to show section headers
section() {
  echo
  echo "============================================"
  echo "  $1"
  echo "============================================"
  echo
}

# Function to run command and show output
run_cmd() {
  echo "$ $1"
  echo
  eval "$1"
  echo
}

section "1. Initialize Issue Tracking"
run_cmd "issue-cards init"

section "2. Create a Feature Issue"
run_cmd "issue-cards create feature --title \"Implement user authentication\" \
  --problem \"Users need to securely log in to access their personalized content.\" \
  --approach \"We'll implement JWT-based authentication with secure cookies.\" \
  --task \"Create User model #unit-test\" \
  --task \"Create login endpoint #e2e-test\" \
  --task \"Implement authentication middleware\" \
  --task \"Add logout functionality\" \
  --instructions \"Follow OWASP security guidelines.\""

section "3. List Issues"
run_cmd "issue-cards list"

section "4. Show Issue Details"
run_cmd "issue-cards show 1"

section "5. View Current Task"
run_cmd "issue-cards current"

section "6. Add a Question"
run_cmd "issue-cards add-question \"What should be the token expiration time?\""

section "7. Log a Failed Approach"
run_cmd "issue-cards log-failure \"Tried using localStorage but it was vulnerable to XSS attacks\""

section "8. Show Issue with Added Context"
run_cmd "issue-cards show 1"

section "9. View Current Task with Added Context"
run_cmd "issue-cards current"

section "10. Add a Task"
run_cmd "issue-cards add-task \"Add password reset functionality\" --tags \"e2e-test\""

section "11. Complete Current Task"
run_cmd "issue-cards complete-task"

section "12. Complete Another Task"
run_cmd "issue-cards complete-task"

section "13. Add a Note"
run_cmd "issue-cards add-note \"We should consider adding rate limiting for login attempts\""

section "14. View Templates"
run_cmd "issue-cards templates"

section "15. View Specific Template"
run_cmd "issue-cards templates feature"

section "16. Complete Remaining Tasks"
run_cmd "issue-cards complete-task"
run_cmd "issue-cards complete-task"
run_cmd "issue-cards complete-task"

section "17. List Issues Again"
run_cmd "issue-cards list"

section "18. Create a Bugfix Issue"
run_cmd "issue-cards create bugfix --title \"Fix authentication error handling\" \
  --problem \"Error messages during login are not user-friendly.\" \
  --approach \"Standardize error handling and improve user messages.\" \
  --task \"Identify error cases #unit-test\" \
  --task \"Improve error messages\" \
  --task \"Add client-side validation\""

section "19. List Multiple Issues"
run_cmd "issue-cards list"

echo
echo "Test script completed successfully!"
echo "You can explore the test directory at: $TEST_DIR"
echo "When finished, you can remove it with: rm -rf $TEST_DIR"
```

To run this test script:

1. Save it as `issue-cards-tutorial-test.sh`
2. Make it executable: `chmod +x issue-cards-tutorial-test.sh`
3. Run it: `./issue-cards-tutorial-test.sh`

This script will create a temporary directory and walk through the complete Issue Cards workflow, demonstrating all key features.

## Summary

Issue Cards provides a lightweight, file-based issue tracking system optimized for both human developers and AI agents. The focus on clear context, structured tasks, and seamless integration with development workflows makes it particularly valuable for maintaining focus and tracking progress.

Key benefits:
- No database or external dependencies
- Git integration for tracking changes
- Tag system for standardized workflows
- Rich context for every task
- Optimized command output for AI consumption

For more information, run `issue-cards --help` or `issue-cards help [command]` to see detailed documentation for specific commands.