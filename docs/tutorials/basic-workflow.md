# Basic Workflow Tutorial

This tutorial covers the essential workflow for using issue-cards. It will guide you through creating issues, managing tasks, and adding context as you work.

## Creating Issues

Issues are the main units of work in issue-cards. Each issue contains:
- A title and description
- A set of tasks to complete
- Additional context like approaches and instructions

To create a new issue:

```bash
issue-cards create feature --title "Add user authentication" \
  --problem "Users need to securely log in." \
  --approach "We'll use JWT tokens with secure cookies." \
  --task "Create User model" \
  --task "Create login API endpoint" \
  --task "Add authentication middleware" \
  --task "Create login form component"
```

You can also create a simple issue with just a title:

```bash
issue-cards create feature --title "Add search functionality"
```

## Viewing Issues

To list all open issues:

```bash
issue-cards list
```

To view the details of a specific issue:

```bash
issue-cards show 1
```

Or to view the current issue if you've set one:

```bash
issue-cards show
```

## Working with Tasks

The current task is the first incomplete task in the current issue. To view it:

```bash
issue-cards current
```

When you finish a task, mark it as complete:

```bash
issue-cards complete-task
```

To add a new task:

```bash
issue-cards add-task "Implement password reset functionality"
```

You can add a task before or after the current task:

```bash
issue-cards add-task "Set up database connection" --before
issue-cards add-task "Add error handling" --after
```

## Documentation and Context

Add questions, notes, or document failed approaches:

```bash
# Add a question
issue-cards add-question "What should be the token expiration time?"

# Log a failed approach
issue-cards log-failure "Tried using localStorage but had security issues"

# Add a general note
issue-cards add-note "We should consider using Redis for session storage"
```

## Summary

In this tutorial, you've learned:

- How to create issues with templates
- How to view and list issues
- How to work with tasks (viewing, completing, adding)
- How to add context through questions, notes, and failed approaches

These basic workflows form the foundation of working with issue-cards and will help you track your work efficiently.

## Related Topics

- [Task Tags](../reference/tag-expansion.md)
- [Task Management](task-management.md)
- [Git Integration](../guides/git-integration.md)