# Common Workflows Guide

This guide provides practical examples for common workflows when using issue-cards.

## Bug Fixing Workflow

A complete workflow for fixing bugs:

```bash
# List open issues to find the bug to fix
issue-cards list

# Create a new bugfix issue if needed
issue-cards create bugfix \
  --title "Fix dropdown menu not working on mobile" \
  --problem "The dropdown menu doesn't respond to touches on mobile devices" \
  --task "Reproduce the issue on mobile devices" \
  --task "Identify the cause of the touch event issue" \
  --task "Fix the event handler for touch events #unit-test" \
  --task "Verify fix on multiple mobile devices #e2e-test"

# Set the issue as current
issue-cards set-current --issue 42

# View the current task
issue-cards current

# Document a failed approach
issue-cards log-failure "Tried adding touchstart event but it creates double-trigger on desktop"

# Add a question
issue-cards add-question "Should we detect device type or use a single event type for all devices?"

# Add a note with your findings
issue-cards add-note "Found that mobile Safari handles events differently than Chrome"

# Complete the current task when done
issue-cards complete-task

# Mark all tasks complete (when the issue is fixed)
issue-cards complete-task
issue-cards complete-task
issue-cards complete-task
```

## Feature Development Workflow

An end-to-end workflow for adding new features:

```bash
# Create a new feature issue
issue-cards create feature \
  --title "Add dark mode support" \
  --problem "Users want to use the app in dark environments" \
  --approach "Implement CSS variables with a theme switcher" \
  --task "Create CSS variable system for colors #unit-test" \
  --task "Add theme switcher component #unit-test" \
  --task "Implement automatic detection of user preferences" \
  --task "Add persistence of theme preference #e2e-test" \
  --task "Update documentation with theme customization #update-docs"

# Set the issue as current
issue-cards set-current --issue 43

# View the first task
issue-cards current

# Add a task you realized was needed
issue-cards add-task "Add dark mode icons and assets" --after

# Complete tasks as you work
issue-cards complete-task

# Add notes as you discover important information
issue-cards add-note "Found we need SVG icons that can inherit currentColor"

# Complete all tasks
issue-cards complete-task
issue-cards complete-task
issue-cards complete-task
issue-cards complete-task
issue-cards complete-task
```

## Refactoring Workflow

A workflow for code refactoring:

```bash
# Create a refactoring issue
issue-cards create refactor \
  --title "Refactor authentication system" \
  --problem "Current authentication code is scattered across multiple files" \
  --approach "Create a centralized auth service" \
  --task "Identify all auth-related code #lint-and-commit" \
  --task "Create AuthService class with unit tests #unit-test" \
  --task "Migrate login functionality to AuthService" \
  --task "Migrate registration to AuthService" \
  --task "Update all references to use new AuthService" \
  --task "Verify all auth flows still work #e2e-test"

# Track your progress
issue-cards current
issue-cards add-question "Should refresh tokens be handled by the AuthService too?"
issue-cards complete-task

# Document important decisions
issue-cards add-note "Decided to make AuthService a singleton to ensure consistent auth state"
```

## Technical Audit Workflow

A workflow for conducting technical audits:

```bash
# Create an audit issue
issue-cards create audit \
  --title "Security audit of API endpoints" \
  --problem "Need to ensure all API endpoints properly validate permissions" \
  --approach "Systematically review each endpoint and its auth checks" \
  --task "Create inventory of all API endpoints" \
  --task "Document required permissions for each endpoint" \
  --task "Audit authentication checks in each endpoint" \
  --task "Audit authorization checks in each endpoint" \
  --task "Identify and fix missing permission checks #unit-test" \
  --task "Create penetration test plan #e2e-test" \
  --task "Document findings and improvements"

# Track findings during the audit
issue-cards add-note "Found 3 endpoints missing proper authorization checks"
issue-cards add-question "Do we have a standard approach for rate limiting sensitive endpoints?"
issue-cards log-failure "Tried using a middleware for all endpoints but some routes are special cases"
```

## Collaborative Workflow

When multiple people are working on the same issue:

```bash
# One developer creates the issue
issue-cards create feature --title "Implement search functionality"

# Another developer adds tasks
issue-cards add-task "Create search index" --before
issue-cards add-task "Optimize search for large datasets" --after

# Developers communicate through notes and questions
issue-cards add-question "What search algorithm should we use?"
issue-cards add-note "Found Elasticsearch might be overkill for our needs"

# Tracking progress
issue-cards complete-task
git commit -am "Complete search index implementation"
git push
```

## Related Topics

- [Git Integration Guide](git-integration.md)
- [Templates Customization](templates-customization.md)
- [Basic Workflow Tutorial](../tutorials/basic-workflow.md)