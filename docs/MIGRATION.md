# Documentation Migration Guide

## Overview

The issue-cards documentation has been restructured to improve organization and usability. This document explains the changes and how to find content in the new structure.

## New Documentation Structure

The documentation has been reorganized into the following structure:

```
/docs
├── getting-started.md           # Quick start guide
├── tutorials/                   # Guided learning materials
│   ├── basic-workflow.md        
│   ├── advanced-features.md     
│   ├── task-management.md
│   └── project-planning.md
├── guides/                      # How-to guides 
│   ├── git-integration.md
│   ├── templates-customization.md
│   ├── ai-integration.md
│   ├── task-management.md
│   ├── custom-installation.md
│   └── common-workflows.md
├── reference/                   # Technical reference
│   ├── environment-vars.md
│   ├── templates.md
│   ├── output-formats.md
│   ├── tag-expansion.md
│   ├── ai-integration.md
│   ├── mcp-server-config.md
│   ├── mcp-tool-reference.md
│   └── mcp-curl-examples.md
└── design/                      # Design decisions
    ├── command-update-plan.md
    ├── output-implementation-plan.md
    └── ...
```

## Accessing Documentation

You can access documentation in two ways:

1. **CLI Help System**:
   ```bash
   # Browse all documentation categories
   issue-cards help
   
   # View a specific documentation topic
   issue-cards help tutorials/basic-workflow
   
   # Get detailed help for a command
   issue-cards create --help
   ```

2. **Markdown Files**:
   The documentation is available as markdown files in the `/docs` directory of the repository.

## File Migration Map

The following files have been moved to the new structure:

| Old Location | New Location |
|--------------|--------------|
| `/docs/environment-variables.md` | `/docs/reference/environment-vars.md` |
| `/docs/templates.md` | `/docs/reference/templates.md` |
| `/docs/output-format.md` | `/docs/reference/output-formats.md` |
| `/docs/ai-integration.md` | `/docs/reference/ai-integration.md` and `/docs/guides/ai-integration.md` |
| `/docs/mcp-server-config.md` | `/docs/reference/mcp-server-config.md` |
| `/docs/mcp-tool-reference.md` | `/docs/reference/mcp-tool-reference.md` |
| `/docs/mcp-curl-examples.md` | `/docs/reference/mcp-curl-examples.md` |
| `/docs/design-decisions/*` | `/docs/design/*` |

The old files will be removed in a future release. Please update your bookmarks and references to use the new locations.

## New Documentation

The following new documentation has been added:

### Tutorials
- `tutorials/basic-workflow.md` - Step-by-step guide to the core workflow
- `tutorials/advanced-features.md` - Guide to advanced features
- `tutorials/task-management.md` - Detailed guide to task management
- `tutorials/project-planning.md` - Guide to planning projects with issue-cards

### Guides
- `guides/git-integration.md` - How to use issue-cards with Git
- `guides/templates-customization.md` - Creating and customizing templates
- `guides/ai-integration.md` - Working with AI tools and issue-cards
- `guides/task-management.md` - Strategies for effective task workflows
- `guides/custom-installation.md` - Advanced installation options
- `guides/common-workflows.md` - Example-driven guide for common use cases

### Reference
- `reference/tag-expansion.md` - Detailed reference for the tag system

## Help Command Enhancement

The `help` command has been enhanced to discover and display markdown documentation:

```bash
# List all available documentation topics
issue-cards help

# View a specific topic
issue-cards help tutorials/basic-workflow
```

For command-specific help, continue to use the `--help` flag:

```bash
issue-cards create --help
```