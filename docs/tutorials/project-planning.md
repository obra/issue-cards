# Project Planning With Issue Cards

This tutorial demonstrates how to use issue-cards to track future improvements identified during development. We'll convert items from an implementation plan into tracked issues.

## Understanding Your Configuration

First, check if you're using the default directory structure or a custom configuration:

```bash
ls -la
```

Issue Cards typically creates an `.issues` directory, but your project might use a custom directory like `issues/` with `open/` and `closed/` subdirectories. This configuration can be set using environment variables:

```bash
export ISSUE_CARDS_DIR="issues"
```

## Creating Issues From A Plan

### Step 1: Check Available Templates

Before creating issues, review the available templates:

```bash
issue-cards templates
```

This will show all templates and their required fields.

### Step 2: Create Issues For Each Plan Item

Convert each item in your plan to a separate issue:

```bash
issue-cards create feature \
  --title "Shorter command aliases" \
  --problem "The current command names are verbose and could be shorter for better usability" \
  --approach "Implement shorter aliases for common commands" \
  --task "Create alias for complete-task -> complete" \
  --task "Create alias for add-task -> add" \
  --task "Create alias for add-question -> question" \
  --task "Create alias for log-failure -> failure" \
  --task "Update documentation to show aliases" \
  --task "Add tests for new command aliases"
```

For bug fixes from your plan:

```bash
issue-cards create bugfix \
  --title "Fix error handling in CLI" \
  --problem "Errors are not consistently formatted" \
  --approach "Standardize error output format"
```

## Organizing Related Issues

For large projects, organize related work:

```bash
# Create a parent feature
issue-cards create feature \
  --title "API Improvements" \
  --problem "Several API enhancements are needed"

# Reference the parent in child issues
issue-cards create feature \
  --title "Add pagination to API endpoints" \
  --problem "API returns all results at once" \
  --note "Part of API Improvements initiative"
```

## Tracking Progress

View all issues created from your plan:

```bash
issue-cards list
```

Focus on one issue at a time:

```bash
issue-cards set-current --issue 1
issue-cards current
```

## Troubleshooting

### Template Not Found Error

If you encounter "Template not found" errors, check that templates are in the expected location:

```bash
# Check template directory location
ls -la .issues/config/templates/issue/
# Or your custom directory
ls -la issues/templates/issue/
```

You may need to copy templates to the correct location or modify directory paths.

### Directory Structure Issues

If commands can't find the issues directory:

```bash
# Check environment variables
echo $ISSUE_CARDS_DIR

# Verify the directory exists
ls -la $ISSUE_CARDS_DIR
```

## Summary

In this tutorial, you've learned how to use issue-cards for project planning:

- Understanding your directory configuration
- Creating issues from plan items
- Organizing related issues for larger projects
- Tracking progress through your implementation plan
- Troubleshooting common configuration issues

These techniques will help you convert planning documents into actionable, tracked issues.

## Related Topics

- [Basic Workflow Tutorial](basic-workflow.md) - Essential workflows
- [Templates Customization Guide](../guides/templates-customization.md) - Create custom templates
- [Common Workflows Guide](../guides/common-workflows.md) - Example-driven guide
- [Advanced Features Tutorial](advanced-features.md) - Learn advanced capabilities