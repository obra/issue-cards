# Common Workflows

This guide provides practical examples for common issue-cards workflows.

## Table of Contents

- [Basic User Workflow](#basic-user-workflow)
- [Bug Fixing Workflow](#bug-fixing-workflow)
- [Feature Development Workflow](#feature-development-workflow)
- [Team Collaboration Workflow](#team-collaboration-workflow)
- [Test-Driven Development Workflow](#test-driven-development-workflow)
- [Working with AI Assistants](#working-with-ai-assistants)
- [Technical Audit Workflow](#technical-audit-workflow)
- [Advanced Usage Patterns](#advanced-usage-patterns)

## Basic User Workflow

This workflow demonstrates the fundamental usage pattern for a solo developer.

### Setup and First Issue

```bash
# Initialize issue tracking in your project
issue-cards init

# Create your first issue
issue-cards create feature --title "Add user authentication" \
  --problem "Users need to securely log in to access their personalized content." \
  --approach "We'll implement JWT-based authentication with secure cookies." \
  --tasks "Create User model +unit-test
Create login endpoint +e2e-test
Add JWT token generation
Implement auth middleware"

# Check what to work on
issue-cards current
```

### Working Through Tasks

```bash
# See what to work on
issue-cards current

# After completing the current task
issue-cards complete-task

# Add a note about something you discovered
issue-cards add-note "We should consider adding rate limiting to the login endpoint."

# Log an approach that didn't work
issue-cards log-failure "Tried using localStorage but it was vulnerable to XSS attacks."

# Add a question that needs answering
issue-cards add-question "What should the token expiration time be?"

# Add a new task that you discovered is needed
issue-cards add-task "Add password reset functionality +e2e-test"

# Continue working through tasks
issue-cards complete-task
```

### Handling Multiple Issues

```bash
# Create another issue
issue-cards create bugfix --title "Fix login redirect"

# See all open issues
issue-cards list

# View details of a specific issue
issue-cards show 2

# Complete all tasks in an issue
issue-cards complete-task
# The issue is automatically moved to closed/ when all tasks are done
```

## Bug Fixing Workflow

A complete workflow for fixing bugs:

```bash
# Create a bugfix issue
issue-cards create bugfix \
  --title "Fix dropdown menu on mobile" \
  --problem "Dropdown menu doesn't respond to touch events on mobile" \
  --task "Reproduce the issue on multiple mobile devices" \
  --task "Identify the cause of the touch event issue" \
  --task "Fix the event handler for touch events +unit-test" \
  --task "Verify fix across devices +e2e-test"

# View the current task
issue-cards current

# Document your findings during investigation
issue-cards log-failure "Tried adding touchstart event but it creates double-trigger on desktop"
issue-cards add-note "Found mobile Safari handles events differently than Chrome"

# Complete tasks as you work
issue-cards complete-task

# Add a new task that wasn't initially planned
issue-cards add-task "Update documentation with mobile event handling details"
```

## Feature Development Workflow

An end-to-end workflow for adding new features:

```bash
# Create a feature issue with detailed planning
issue-cards create feature \
  --title "Add dark mode support" \
  --problem "Users want to use the app in dark environments" \
  --approach "Implement CSS variables with a theme switcher" \
  --task "Create CSS variable system for colors +unit-test" \
  --task "Add theme switcher component +unit-test" \
  --task "Implement automatic detection of user preferences" \
  --task "Add persistence of theme preference +e2e-test"

# View the first task
issue-cards current

# Add a task you realized was needed
issue-cards add-task "Add dark mode icons and assets"

# Document important decisions
issue-cards add-note "Found we need SVG icons that can inherit currentColor"

# Complete tasks as you work
issue-cards complete-task
```

## Team Collaboration Workflow

When multiple developers work on issues:

```bash
# Developer A creates the issue
issue-cards create feature --title "Implement search functionality"

# Developer B adds tasks and questions
issue-cards add-task "Create search index" --before
issue-cards add-question "What search algorithm should we use?"

# Developer A answers questions
issue-cards add-note "Let's use Lunr.js for client-side search"

# Developer B completes and commits work
issue-cards complete-task
git commit -am "Implement search index with Lunr.js"
git push

# Developer A pulls the changes
git pull
issue-cards list
# Sees that the first task is completed
```

## Test-Driven Development Workflow

Using tag templates for TDD process:

```bash
# Create a feature with TDD tasks
issue-cards create feature \
  --title "Add form validation" \
  --task "Implement email validation +unit-test"

# The +unit-test tag expands to multiple steps:
# - Write failing unit tests for the functionality
# - Run the unit tests and verify they fail
# - Implement email validation
# - Run unit tests and verify they pass
# - Make sure test coverage meets requirements

# Document test implementation
issue-cards add-note "Created tests that verify email format, required fields, and error display"

# Document approach after passing tests
issue-cards add-note "Implemented validation using regex with custom error messages"
```

## Working with AI Assistants

This workflow demonstrates how to use Issue Cards with AI coding assistants.

```bash
# Set up the project and create an issue
issue-cards init
issue-cards create feature --title "Implement search functionality"

# Show the current task to the AI assistant
issue-cards current

# Based on AI's work, log failures for future reference
issue-cards log-failure "Initial regex-based approach was too slow for large datasets"

# After AI completes the task
issue-cards complete-task

# Add a new task based on AI's suggestions
issue-cards add-task "Add caching layer for search results +unit-test"

# Continue the collaboration
issue-cards current
# Share this with AI...
```

AI assistants benefit from the structured format and clear context that Issue Cards provides, making it easier for them to understand what needs to be done and what's already been tried.

## Technical Audit Workflow

For reviewing and improving existing code:

```bash
# Create an audit issue
issue-cards create audit \
  --title "Security audit of API endpoints" \
  --problem "Need to ensure all endpoints validate permissions" \
  --task "Create inventory of all API endpoints" \
  --task "Document required permissions for each endpoint" \
  --task "Audit authentication checks in endpoints" \
  --task "Fix missing permission checks +unit-test"

# Track findings
issue-cards add-note "Found 3 endpoints missing proper auth checks"
issue-cards add-question "Do we need rate limiting on sensitive endpoints?"
```

## Advanced Usage Patterns

### Using Multiple Tag Templates

Combining templates for comprehensive workflows:

```bash
# Add a task with multiple templates
issue-cards add-task "Implement reset password feature +unit-test +e2e-test +update-docs"

# This expands to include steps for:
# - Unit testing the functionality
# - End-to-end testing the user flow
# - Updating documentation with the new feature
```

### Creating Custom Templates

```bash
# Copy an existing template as a starting point
cp .issues/config/templates/tag/unit-test.md .issues/config/templates/tag/performance-test.md

# Edit the template to add performance testing steps
# Then use it
issue-cards add-task "Optimize database queries +performance-test"
```

### Integrating with CI/CD

You can use Issue Cards in CI/CD workflows:

```bash
# In a CI script
if [ -d ".issues" ]; then
  # Count open issues with a specific tag
  ISSUES_WITH_TODOS=$(grep -l "#todo" .issues/open/*.md | wc -l)
  
  # Count open issues with specific expansion tags
  ISSUES_WITH_UNIT_TESTS=$(grep -l "+unit-test" .issues/open/*.md | wc -l)
  
  # Fail build if there are too many open TODOs
  if [ $ISSUES_WITH_TODOS -gt 10 ]; then
    echo "Too many open TODO items. Please complete some before adding more."
    exit 1
  fi
fi
```

### Using with Git Hooks

You can set up a pre-commit hook to verify issues are properly formatted:

```bash
# .git/hooks/pre-commit
#!/bin/sh

# Check if any issue files are being committed
ISSUE_FILES=$(git diff --cached --name-only | grep ".issues/open/")

if [ -n "$ISSUE_FILES" ]; then
  # Run validation on issue files
  for file in $ISSUE_FILES; do
    # Check if file has all required sections
    if ! grep -q "## Problem to be solved" "$file"; then
      echo "Error: $file is missing required sections"
      exit 1
    fi
  done
fi

exit 0
```

For detailed help on any command, use:

```bash
issue-cards <command> --help
```