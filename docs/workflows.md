# Common Workflows

This guide provides practical examples for common issue-cards workflows.

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
```

## Feature Development Workflow

An end-to-end workflow for adding new features:

```bash
# Create a feature issue
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

## Using Multiple Tag Templates

Combining templates for comprehensive workflows:

```bash
# Add a task with multiple templates
issue-cards add-task "Implement reset password feature +unit-test +e2e-test +update-docs"

# This expands to include steps for:
# - Unit testing the functionality
# - End-to-end testing the user flow
# - Updating documentation with the new feature
```

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

For detailed help on any command, use:

```bash
issue-cards <command> --help
```