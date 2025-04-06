# Advanced Features Tutorial

This tutorial covers advanced features and workflows in issue-cards.

## Templates Management

issue-cards comes with several built-in templates for different types of work.

```bash
# List available templates with usage examples
issue-cards templates

# View details of a specific template
issue-cards templates feature
```

## Git Integration

If your project uses Git, issue-cards is designed to work seamlessly with it:

- Issue files are stored in the repository
- Changes can be committed to track progress
- Branch management can be aligned with issues

See the [Git Integration Guide](../guides/git-integration.md) for more details.

## Custom Templates

You can create custom issue and tag templates to match your workflow:

```bash
# Create a custom issue template
echo "# {{title}}

## User Story
As a {{userRole}}, I want to {{userWant}} so that {{userBenefit}}.

## Acceptance Criteria
{{acceptanceCriteria}}

## Tasks
{{tasks}}" > templates/issue/user-story.md

# Use the custom template
issue-cards create user-story --title "Add search feature" \
  --var userRole="user" \
  --var userWant="search for products" \
  --var userBenefit="can find what I'm looking for quickly" \
  --var acceptanceCriteria="- Search returns relevant results\n- Search is fast\n- Search handles typos"
```

## Advanced Task Management

### Task Placement

Position new tasks relative to the current task:

```bash
# Add a task before the current task
issue-cards add-task "Set up test environment" --before

# Add a task after the current task
issue-cards add-task "Add error handling" --after

# Add a task at a specific position
issue-cards add-task "Update documentation" --at 3
```

### Multiple Tags

Combine multiple tags on a single task:

```bash
# Add a task with multiple tags
issue-cards add-task "Implement user authentication" --tags "unit-test,e2e-test,update-docs"
```

## Environment Variables

issue-cards behavior can be customized with environment variables:

```bash
# Set custom directories
export ISSUE_CARDS_DIR=".tickets"

# Configure output format
export ISSUE_CARDS_OUTPUT_FORMAT="json"

# Enable debug mode
export ISSUE_CARDS_DEBUG="true"
```

See [Environment Variables Reference](../reference/environment-vars.md) for all available options.

## MCP Server

The Model Communication Protocol (MCP) server allows AI models to interact with issue-cards:

```bash
# Start the MCP server
issue-cards serve

# Start on a custom port
issue-cards serve --port 4000
```

This enables integrations with AI assistants and other tools.

## Related Topics

- [Templates Customization Guide](../guides/templates-customization.md)
- [AI Integration Guide](../guides/ai-integration.md)
- [Task Management Tutorial](task-management.md)