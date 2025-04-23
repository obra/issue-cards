// ABOUTME: Index file for AI-specific documentation
// ABOUTME: Contains links and descriptions of all AI documentation

# AI Documentation for issue-cards

This directory contains documentation specifically formatted for AI assistants to understand how to interact with the issue-cards system using MCP tools.

## Roles

Documentation for specific user roles:

- [Project Manager](roles/project-manager.md) - For managing issues, creating tasks, and tracking progress
- [Developer](roles/developer.md) - For implementing tasks and documenting work
- [Reviewer](roles/reviewer.md) - For reviewing issues and providing feedback

## Workflows

Step-by-step guides for common workflows:

- [Create Feature](workflows/create-feature.md) - Creating and managing feature issues
- [Bugfix](workflows/bugfix.md) - Identifying, fixing, and testing bugs
- [Task Management](workflows/task-management.md) - Working through individual tasks
- [Review](workflows/review.md) - Reviewing issues and providing feedback
- [Audit](workflows/audit.md) - Conducting technical audits

## Best Practices

Guidance for effectively using issue-cards:

- [Task Organization](best-practices/task-organization.md) - Best practices for creating and organizing tasks
- [Documentation](best-practices/documentation.md) - Effective issue and task documentation
- [Comprehensive Usage](best-practices/comprehensive-usage.md) - Advanced strategies for effective issue management

## Tool Examples

Example tool usage patterns:

- [Basic Usage](tool-examples/basic-usage.md) - Common tool operations and patterns
- [Advanced Usage](tool-examples/advanced-usage.md) - Complex workflows and combinations
- [Tag Templates](tool-examples/tag-templates.md) - Using standardized task workflows with tags
- [Claude Integration](tool-examples/claude-integration.md) - Examples of Claude interaction patterns

## Using This Documentation

This documentation is designed to be consumed by AI assistants through the MCP onboarding tools. The content is structured to provide consistent guidance on using issue-cards effectively.

When using issue-cards with an AI assistant, you can direct the assistant to use the onboarding tools with commands like:

```
You're a project manager. Use issue-cards pm onboarding to get started.
```

The AI assistant will then use the `mcp__onboarding` tool to access this documentation and provide role-appropriate guidance.