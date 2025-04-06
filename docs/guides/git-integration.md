# Git Integration Guide

This guide explains how to integrate issue-cards with Git workflows.

## Overview

issue-cards is designed to work seamlessly with Git repositories, allowing you to track issues alongside your code.

## Repository Setup

When you initialize issue-cards in a Git repository, it automatically creates the necessary directories and adds them to your repository.

```bash
# Initialize issue-cards in your Git repository
issue-cards init
```

This will create:
- `/issues/open/` - Directory for open issues
- `/issues/closed/` - Directory for closed issues
- `/templates/` - Directory for issue templates

## Issue Workflow with Git

### Creating Issues

When you create an issue, a new markdown file is created in the `/issues/open/` directory.

```bash
issue-cards create feature --title "Implement new feature"
```

You should commit this file to your repository:

```bash
git add issues/open/issue-XXXX.md
git commit -m "Add issue for new feature implementation"
```

### Working on Issues

As you complete tasks within an issue, the issue file is updated automatically.

```bash
issue-cards complete-task
```

You should commit these changes regularly:

```bash
git add issues/open/issue-XXXX.md
git commit -m "Update progress on issue XXXX"
```

### Closing Issues

When an issue is completed, it's moved from `/issues/open/` to `/issues/closed/`.

You should commit this change:

```bash
git add issues/open/ issues/closed/
git commit -m "Close issue XXXX"
```

## Branch Management

It's a good practice to create a branch for each issue:

```bash
# Create and switch to a new branch for the issue
git checkout -b issue-XXXX
```

## Recommended Workflow

1. Create an issue: `issue-cards create feature --title "Feature name"`
2. Commit the issue file
3. Create a branch for the issue
4. Work on tasks, complete them, and commit regularly
5. When all tasks are complete, close the issue
6. Merge the branch back to your main branch

## Related Topics

- [Basic Workflow](../tutorials/basic-workflow.md)
- [Task Management](../tutorials/task-management.md)