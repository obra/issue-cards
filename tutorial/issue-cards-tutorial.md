# Creating Issues from Our Project Plan

This tutorial demonstrates how to use Issue Cards to track future improvements identified during development. We'll convert items from our implementation plan into tracked issues.

## Step 1: Understanding where we are

Let's first check what issues directory format we're working with. Issue Cards initially creates a `.issues` directory, but let's check for any custom configuration:

```bash
ls -la
```

We can see that our project uses a `issues/` directory with `open/` and `closed/` subdirectories instead of the default `.issues/` directory. This is a common customization.

## Step 2: Creating our first issue from the plan

Let's create an issue based on the first improvement from our implementation plan. We'll need to check the available templates first:

```bash
./bin/issue-cards.js templates
```

Then, we'll create a new issue with the feature template:

```bash
./bin/issue-cards.js create feature --title "Shorter command aliases" --problem "The current command names are verbose and could be shorter for better usability" --approach "Implement shorter aliases for common commands" --tasks "Create alias for complete-task -> complete
Create alias for add-task -> add
Create alias for add-question -> question
Create alias for log-failure -> failure
Update documentation to show aliases
Add tests for new command aliases"
```

Note: If you run into template not found errors, you may need to copy templates to the correct location or modify the directory paths in the code.

## Troubleshooting

If you encounter "Template not found" errors, this is often because the templates are not in the expected location. The code is looking for templates in `.issues/config/templates/issue/` but our project might be using a different structure.

Let's examine our directory structure: