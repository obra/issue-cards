# Example Workflows

This document demonstrates common workflows and use cases for Issue Cards.

## Table of Contents

- [Basic User Workflow](#basic-user-workflow)
- [Team Workflow](#team-workflow)
- [Bug Fix Workflow](#bug-fix-workflow)
- [Feature Implementation Workflow](#feature-implementation-workflow)
- [Working with AI Assistants](#working-with-ai-assistants)
- [Advanced Usage Patterns](#advanced-usage-patterns)

## Basic User Workflow

This workflow demonstrates the fundamental usage pattern for a solo developer or AI assistant.

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

## Team Workflow

This workflow demonstrates how a team might use Issue Cards together.

```bash
# Developer A initializes issue tracking
issue-cards init

# Developer A creates the initial issue
issue-cards create feature --title "Implement shopping cart"

# Developer B clones the repository and can see the issue
issue-cards list

# Developer B adds a question
issue-cards add-question "Should we persist the cart for logged-out users?"

# Developer A answers the question and adds a task
issue-cards add-task "Add local storage for guest carts +unit-test"

# Developer B takes on the work
issue-cards current
# Works on task

# After completing, changes are automatically staged in git
issue-cards complete-task
git commit -m "Implement persistent guest cart storage"
git push

# Developer A pulls the changes
git pull
issue-cards list
# Sees that the first task is completed
```

## Bug Fix Workflow

This workflow demonstrates the process of fixing a bug using Issue Cards.

```bash
# Create a bug issue
issue-cards create bugfix --title "Fix incorrect price calculation" \
  --problem "Prices are sometimes showing incorrect totals in the shopping cart." \
  --approach "Debug the calculation logic and fix edge cases." \
  --tasks "Add test case that reproduces the bug +unit-test
Fix calculation function
Add special handling for discounted items
Verify fix in browser"

# First step: reproduce the bug
issue-cards current

# Log what you find during debugging
issue-cards log-failure "Bug occurs when items have decimal quantities (e.g., 1.5 kg)"

# Complete the reproduction task
issue-cards complete-task

# Add a new task that wasn't initially planned
issue-cards add-task "Update quantity input to handle decimal values properly +unit-test"

# Continue fixing tasks
issue-cards complete-task
```

## Feature Implementation Workflow

This workflow demonstrates implementing a complete feature.

```bash
# Create feature issue with detailed planning
issue-cards create feature --title "Implement user profiles" \
  --problem "Users need to be able to view and edit their profile information." \
  --approach "Create a profile page with editable fields and avatar upload." \
  --instructions "Follow the design mockups in Figma. Ensure all fields are properly validated." \
  --tasks "Create profile database schema +unit-test
Implement profile API endpoints +e2e-test
Create profile page component +unit-test
Add avatar upload functionality
Implement form validation +unit-test
Connect profile page to API
Add form error handling" \
  --next-steps "After this is complete, we'll add social media linking to profiles."

# Work through tasks
issue-cards current
# Implementation work...
issue-cards complete-task

# Add notes as you work
issue-cards add-note "Avatar upload should support WebP format for better compression."

# When discovering edge cases
issue-cards add-task "Add handling for email change verification +e2e-test"

# After completing all tasks
issue-cards complete-task
# Issue is automatically moved to closed/ when complete
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

AI assistants often benefit from the structured format and clear context that Issue Cards provides, making it easier for them to understand what needs to be done and what's already been tried.

## Advanced Usage Patterns

### Using Multiple Tags

```bash
# Add a task with multiple expansion tags
issue-cards add-task "Implement user settings page +unit-test +e2e-test +update-docs"

# When viewing the current task, all tags' steps will be combined
issue-cards current
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