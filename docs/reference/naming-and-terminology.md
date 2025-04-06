# Issue Cards Naming and Terminology Guide

This document establishes the standardized naming conventions and terminology used throughout the Issue Cards project. Consistent naming patterns make the application more intuitive, maintainable, and cohesive across all interfaces.

## Table of Contents

- [Core Terminology](#core-terminology)
- [CLI Argument Naming](#cli-argument-naming)
- [API Parameter Naming](#api-parameter-naming)
- [Code Organization](#code-organization)
- [Function and Method Naming](#function-and-method-naming)
- [Variable Naming](#variable-naming)
- [Documentation Style](#documentation-style)
- [Error Messages](#error-messages)
- [Filesystem Structure](#filesystem-structure)

## Core Terminology

### Issue Concepts

| Term | Definition | Example/Notes |
|------|------------|---------------|
| **Issue** | A work item tracked in the system | Bug fix, feature, refactor |
| **Task** | A specific action item within an issue | "Write unit tests for login function" |
| **Current Issue** | The issue currently being worked on | Marked with ⚡ in listings |
| **Current Task** | The specific task within an issue that is being worked on | First incomplete task in the list |
| **Issue Number** | Unique numerical identifier for an issue | #0001, #0042 |
| **Template** | Predefined structure for issues or tag expansions | feature.md, unit-test.md |
| **Tag** | Identifier for task expansion or categorization | +unit-test, +update-docs |
| **Section** | A specific part of an issue document | "Problem to be solved", "Tasks" |

### Issue States

| Term | Definition | Example/Notes |
|------|------------|---------------|
| **Open** | An issue that is still being worked on | Located in `.issues/open/` |
| **Closed** | An issue that has been completed | Located in `.issues/closed/` |
| **Complete** | A task that has been finished | Marked with `[x]` |
| **Incomplete** | A task that is still pending | Marked with `[ ]` |

## CLI Argument Naming

### Issue Identification

For CLI commands that operate on specific issues:

| Standard | Pattern | Example |
|----------|---------|---------|
| **Preferred** | `--issue <number>` | `--issue 123` |
| **Avoid** | `--issue-number <number>` | ~~`--issue-number 123`~~ |
| **Avoid** | `--issue-id <number>` | ~~`--issue-id 123`~~ |

### Sections

For operating on specific sections within an issue:

| Standard | Pattern | Example |
|----------|---------|---------|
| **Preferred** | `--section <name>` | `--section problem` |
| **Avoid** | `--section-name <name>` | ~~`--section-name problem`~~ |

### Short Option Forms

Short forms for frequently used options:

| Long Form | Short Form | Example |
|-----------|------------|---------|
| `--issue` | `-i` | `-i 123` |
| `--section` | `-s` | `-s problem` |
| `--format` | `-f` | `-f json` |
| `--reason` | `-r` | `-r "Performance issues"` |

### Boolean Flags

For boolean options (flags that don't require a value):

| Standard | Pattern | Example |
|----------|---------|---------|
| **Preferred** | `--flag-name` | `--verbose` |
| **Avoid** | `--flag-name=true` | ~~`--verbose=true`~~ |

For flags that can be negated:

| Standard | Pattern | Example |
|----------|---------|---------|
| **Preferred** | `--no-flag-name` | `--no-git` |
| **Avoid** | `--flag-name=false` | ~~`--git=false`~~ |

## API Parameter Naming

### RESTful Endpoints

| Resource Type | Endpoint Pattern | Example |
|---------------|------------------|---------|
| Collection | `/api/resource` | `/api/issues` |
| Specific Item | `/api/resource/:id` | `/api/issues/0001` |
| Nested Resource | `/api/resource/:id/subresource` | `/api/issues/0001/tasks` |
| Action | `/api/resource/:id/action` | `/api/issues/0001/complete` |

### Parameter Naming

| CLI Equivalent | API Parameter | Example |
|----------------|---------------|---------|
| `--issue` | `issueId` | `{ "issueId": "0001" }` |
| `--section` | `section` | `{ "section": "problem" }` |
| `--format` | `format` | `{ "format": "json" }` |
| `--reason` | `reason` | `{ "reason": "Performance issues" }` |

### Response Structure

| Field | Purpose | Example |
|-------|---------|---------|
| `success` | Indicates if the operation succeeded | `{ "success": true }` |
| `data` | Contains the response payload | `{ "data": { "issue": {...} } }` |
| `error` | Error message if operation failed | `{ "error": "Issue not found" }` |
| `metadata` | Additional information about the response | `{ "metadata": { "count": 5 } }` |

## Code Organization

### Module Types

| Type | Purpose | Example Filename |
|------|---------|------------------|
| **Command** | CLI command implementation | `addNote.js` |
| **Utility** | Reusable helper functions | `sectionManager.js` |
| **Model** | Data structure representation | `issueManager.js` |
| **Service** | Business logic implementation | `taskExpander.js` |
| **API** | REST API endpoints | `issueEndpoints.js` |
| **MCP** | AI integration tools | `mcp/tools.js` |

### Directory Structure

| Directory | Purpose |
|-----------|---------|
| `src/commands/` | CLI command implementations |
| `src/utils/` | Utility functions |
| `src/mcp/` | AI integration (Model-Code-Prompt) |
| `templates/` | Default templates |
| `docs/` | Documentation |
| `tests/` | Test files |

## Function and Method Naming

### Action Verbs

Consistent verbs for similar operations:

| Operation | Preferred Verb | Avoid |
|-----------|----------------|-------|
| Creating new items | `create`, `add` | `make`, `new` |
| Modifying items | `update`, `modify` | `change`, `alter` |
| Removing items | `remove`, `delete` | `destroy`, `kill` |
| Retrieving items | `get`, `find` | `fetch`, `retrieve` |
| Checking conditions | `is`, `has`, `check` | `verify`, `test` |

### Function Naming Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| `verbNoun` | Action on resource | `addTask`, `createIssue` |
| `nounVerb` | Resource that performs action | `sectionManager`, `taskExpander` |
| `isCondition` | Boolean check | `isInitialized`, `hasOpenIssues` |

## Variable Naming

### General Variables

| Type | Pattern | Example |
|------|---------|---------|
| **Constant** | UPPER_SNAKE_CASE | `DEFAULT_TEMPLATE_PATH` |
| **Variable** | camelCase | `issueNumber`, `templatePath` |
| **Boolean** | is/has prefix | `isValid`, `hasTemplate` |
| **Private** | underscore prefix | `_processIssue`, `_cachedResult` |

### Parameter Naming

Consistent parameter names across the codebase:

| Concept | Parameter Name | Example Usage |
|---------|----------------|---------------|
| Issue identifier | `issue` | `function getIssue(issue)` |
| Issue full object | `issueData` | `function updateIssue(issueData)` |
| Task description | `taskText` | `function addTask(taskText, options)` |
| Section name | `section` | `function addToSection(section, content)` |
| File path | `filePath` | `function readFile(filePath)` |
| Option object | `options` | `function doSomething(primary, options)` |

## Documentation Style

### JSDoc Comments

| Element | Format | Example |
|---------|--------|---------|
| Function description | Short action statement | `/** Adds a task to an issue */` |
| Parameters | `@param {type} name - Description` | `@param {string} issueId - The issue identifier` |
| Returns | `@returns {type} Description` | `@returns {boolean} True if successful` |
| Throws | `@throws {ErrorType} Description` | `@throws {UserError} If issue not found` |

### README and Markdown Files

| Section | Content |
|---------|---------|
| **Title** | Clear description of content |
| **Introduction** | Brief overview |
| **Usage Examples** | Practical examples showing key functionality |
| **API Reference** | Detailed documentation of functions/commands |
| **Related Information** | Links to related documents |

## Error Messages

| Pattern | Format | Example |
|---------|--------|---------|
| User errors | Clear explanation with recovery hint | "Issue #123 not found (Use 'list' to see available issues)" |
| System errors | Problem identification without internals | "Failed to write issue file (Check file permissions)" |
| Development errors | Detailed technical information | "Failed to parse template: Invalid YAML at line 5" |

### Error Types

| Error Type | Purpose | Example |
|------------|---------|---------|
| `UserError` | User-facing problems with recovery hints | "No current issue (Run 'set-current' first)" |
| `SystemError` | System-level problems | "Failed to access filesystem" |
| `ValidationError` | Input validation failures | "Invalid template format" |

## Filesystem Structure

### Issue Files

| Pattern | Explanation | Example |
|---------|-------------|---------|
| `issue-NNNN.md` | 4-digit zero-padded issue number | `issue-0001.md` |
| `.issues/open/` | Directory for open issues | `.issues/open/issue-0001.md` |
| `.issues/closed/` | Directory for closed issues | `.issues/closed/issue-0001.md` |
| `.issues/.current` | File indicating current issue | Contains issue number |

### Template Files

| Pattern | Explanation | Example |
|---------|-------------|---------|
| `templates/issue/` | Issue templates | `templates/issue/feature.md` |
| `templates/tag/` | Tag expansion templates | `templates/tag/unit-test.md` |

## Conclusion

This naming and terminology guide serves as the source of truth for consistent naming across the Issue Cards project. All new code, documentation, and interfaces should follow these conventions. When updating existing code, align with these standards to improve the overall consistency of the project.

For questions or clarifications about these naming standards, contact the project maintainers or refer to the project's contribution guidelines.