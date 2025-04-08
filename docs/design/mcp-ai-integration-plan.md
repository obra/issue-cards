# MCP AI Integration Plan

This document outlines the plan for enhancing the issue-cards MCP server with improved AI integration capabilities, focusing on documentation-driven onboarding tools.

## Current Status

The issue-cards project has implemented an MCP server that provides a robust API for AI integration. Recently, we added onboarding tools (`mcp__onboarding`, `mcp__workflow`, etc.) to help AI assistants understand how to use the system effectively. However, these tools currently contain hardcoded content that duplicates information already present in our documentation.

## Goals

1. Create a documentation-driven architecture for AI onboarding tools
2. Eliminate duplication between code and documentation
3. Ensure documentation and AI guidance remain in sync
4. Make it easy for both humans and AIs to discover best practices
5. Provide role-specific and workflow-specific guidance to AIs

## Implementation Plan

### Phase 1: Documentation Restructuring

Create a new AI-specific documentation structure:

```
docs/
  |- ai/
  |   |- roles/
  |   |   |- project-manager.md
  |   |   |- developer.md
  |   |   |- reviewer.md
  |   |
  |   |- workflows/
  |   |   |- create-feature.md
  |   |   |- bugfix.md
  |   |   |- task-management.md
  |   |
  |   |- best-practices/
  |   |   |- documentation.md
  |   |   |- task-organization.md
  |   |
  |   |- tool-examples/
  |       |- basic-usage.md
  |       |- advanced-usage.md
  |
  |- guides/
  |   |- (existing guide files)
  |
  |- reference/
      |- (existing reference files)
```

Each AI documentation file should follow a consistent structure:

**For roles:**
```markdown
# [Role Name] Onboarding

## Introduction
Brief description of this role's responsibilities in issue-cards.

## Recommended Workflows
- List of workflows that are relevant to this role
- Links to detailed workflow documentation

## Best Practices
- List of best practices specific to this role
- Concrete examples for each practice

## Tool Usage Map
- Mapping of common tasks to specific MCP tools
- Example tool calls for each task
```

**For workflows:**
```markdown
# [Workflow Name]

## Overview
Brief description of the workflow purpose and when to use it.

## Steps
1. Step 1 description with corresponding MCP tool
2. Step 2 description with corresponding MCP tool
3. ...

## Example Tool Sequence
```json
[
  { "tool": "tool_name", "args": { ... } },
  { "tool": "next_tool", "args": { ... } },
  ...
]
```

## Tips
- List of tips for successfully executing this workflow
- Potential pitfalls to avoid
```

### Phase 2: Documentation Parser Development

Develop a documentation parser utility:

```javascript
// documentationParser.js
const fs = require('fs');
const path = require('path');

/**
 * Load and parse a markdown file from the AI documentation
 * 
 * @param {string} category - Category (roles, workflows, best-practices, tool-examples)
 * @param {string} name - Document name
 * @returns {Object} Parsed document with sections
 */
function loadAiDoc(category, name) {
  const filePath = path.resolve(
    __dirname, 
    `../../docs/ai/${category}/${name}.md`
  );
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Parse the markdown into sections
  return parseMarkdown(content);
}

/**
 * Parse markdown content into structured sections
 * 
 * @param {string} markdown - Markdown content
 * @returns {Object} Structured content by section
 */
function parseMarkdown(markdown) {
  // Implementation of markdown parsing
  // Extract sections, code blocks, lists, etc.
}

/**
 * Get documentation for a specific role
 * 
 * @param {string} role - Role name (project-manager, developer, reviewer)
 * @returns {Object} Role documentation structure
 */
function getRoleDoc(role) {
  // Normalize role name for file lookup
  const normalizedRole = role === 'pm' ? 'project-manager' : role;
  return loadAiDoc('roles', normalizedRole);
}

/**
 * Get documentation for a specific workflow
 * 
 * @param {string} workflow - Workflow name
 * @returns {Object} Workflow documentation structure
 */
function getWorkflowDoc(workflow) {
  return loadAiDoc('workflows', workflow);
}

module.exports = {
  loadAiDoc,
  getRoleDoc,
  getWorkflowDoc
};
```

### Phase 3: Refactor Onboarding Tools

Update the onboarding tools to use the documentation parser:

```javascript
// onboardingTools.js
const { withValidation } = require('./validator');
const { withErrorHandling, createValidationError } = require('./errorHandler');
const { getRoleDoc, getWorkflowDoc } = require('./documentationParser');

/**
 * Get onboarding information for project management workflows
 * 
 * @param {Object} args - Command arguments
 * @param {string} [args.role] - Role-specific onboarding (pm, developer, reviewer)
 * @returns {Promise<Object>} MCP result object with onboarding information
 */
const mcp__onboarding = withValidation('mcp__onboarding',
  withErrorHandling(async (args) => {
    // Default to project manager if no role specified
    const role = args.role || 'pm';
    
    try {
      // Load role documentation
      const roleDoc = getRoleDoc(role);
      
      // Return formatted response
      return {
        success: true,
        data: {
          title: roleDoc.title,
          description: roleDoc.sections.introduction,
          workflows: roleDoc.sections.recommendedWorkflows,
          bestPractices: roleDoc.sections.bestPractices,
          toolMap: roleDoc.sections.toolUsageMap
        }
      };
    } catch (error) {
      return createValidationError(`Unknown role: ${role}. Available roles: pm, developer, reviewer`);
    }
  }, 'onboarding')
);

/**
 * Get workflow guide for common issue-cards processes
 * 
 * @param {Object} args - Command arguments
 * @param {string} args.workflow - The workflow to get guidance for
 * @returns {Promise<Object>} MCP result object with workflow guide
 */
const mcp__workflow = withValidation('mcp__workflow',
  withErrorHandling(async (args) => {
    // If no workflow specified, return list of available workflows
    if (!args.workflow) {
      const workflows = ['create-feature', 'bugfix', 'task-management'];
      return {
        success: true,
        data: {
          title: "Available Workflows",
          workflows: workflows.map(name => {
            try {
              const doc = getWorkflowDoc(name);
              return {
                id: name,
                title: doc.title,
                description: doc.sections.overview
              };
            } catch (error) {
              return { id: name, title: name, description: "Documentation unavailable" };
            }
          })
        }
      };
    }
    
    try {
      // Load workflow documentation
      const workflowDoc = getWorkflowDoc(args.workflow);
      
      // Return formatted response
      return {
        success: true,
        data: {
          title: workflowDoc.title,
          description: workflowDoc.sections.overview,
          steps: workflowDoc.sections.steps,
          exampleToolSequence: workflowDoc.sections.exampleToolSequence,
          tips: workflowDoc.sections.tips
        }
      };
    } catch (error) {
      return createValidationError(`Unknown workflow: ${args.workflow}`);
    }
  }, 'workflow')
);

// Role-specific aliases remain the same
// ...

module.exports = {
  mcp__onboarding,
  mcp__workflow,
  // ...
};
```

### Phase 4: Documentation Migration

1. Extract content from existing documentation files:
   - `docs/guides/common-workflows.md`
   - `docs/guides/task-management.md`
   - `docs/reference/claude-prompt-examples.md`
   - `docs/reference/mcp-tool-reference.md`

2. Restructure this content into the new AI-specific documentation files.

3. Ensure cross-references between human-oriented and AI-oriented documentation.

4. Add links in the human documentation to the equivalent AI documentation.

### Phase 5: Testing and Validation

1. Unit tests for the documentation parser
2. Integration tests for the onboarding tools
3. End-to-end tests that verify the tools return expected content
4. Manual verification of AI integration with a test prompt

## Example Documentation Files

### docs/ai/roles/project-manager.md

```markdown
# Project Manager Onboarding

## Introduction
As a project manager using issue-cards, you'll be responsible for creating and organizing issues, defining tasks, and tracking progress. The system provides tools to help you plan work, document requirements, and monitor team progress.

## Recommended Workflows
- [Create Feature Issue](../workflows/create-feature.md) - For planning and tracking new features
- [Bugfix Workflow](../workflows/bugfix.md) - For managing bug fixes
- [Technical Audit](../workflows/audit.md) - For conducting technical reviews

## Best Practices
- **Define clear problem statements**: Make sure each issue has a well-defined problem to solve
- **Break work into small tasks**: Tasks should be completable in 1-2 hours
- **Include success criteria**: Define what "done" looks like for each task
- **Add context information**: Provide relevant background information to help developers
- **Identify questions early**: Use the Questions section to capture unknowns

## Tool Usage Map
- **Creating issues**: Use `mcp__createIssue` with template, title, and problem
- **Viewing all issues**: Use `mcp__listIssues` to see project status
- **Adding tasks**: Use `mcp__addTask` to expand existing issues
- **Examining issues**: Use `mcp__showIssue` to view detailed information
- **Setting current issue**: Use `mcp__setCurrentIssue` to focus on specific work
```

### docs/ai/workflows/create-feature.md

```markdown
# Create Feature Issue Workflow

## Overview
This workflow guides you through creating a well-structured feature issue in issue-cards. Use this when planning and implementing new functionality.

## Steps
1. Check available templates using `mcp__listTemplates` with `type: "issue"`
2. Create new feature issue using `mcp__createIssue` with the feature template
3. Add detailed tasks using `mcp__addTask` for each work item
4. Verify the issue was created successfully with `mcp__listIssues`

## Example Tool Sequence
```json
[
  { 
    "tool": "mcp__createIssue",
    "args": {
      "template": "feature",
      "title": "Implement user authentication",
      "problem": "Users need to securely log in to the application",
      "approach": "Use JWT-based authentication with secure password hashing",
      "task": [
        "Research authentication libraries",
        "Design user schema",
        "Implement login endpoint",
        "Add token validation middleware",
        "Create login form UI"
      ]
    }
  },
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  }
]
```

## Tips
- Use descriptive, action-oriented issue titles
- Focus the problem statement on user/business needs, not implementation
- Order tasks logically by dependency and complexity
- Include research tasks before implementation tasks
- Add testing tasks with appropriate tags
```

## Project Timeline

1. **Week 1: Planning and Documentation Restructuring**
   - Create documentation directory structure
   - Write example documentation files
   - Get feedback and approval on structure

2. **Week 2: Documentation Parser Development**
   - Develop and test the documentation parser
   - Write unit tests for the parser
   - Create documentation index

3. **Week 3: Onboarding Tool Refactoring**
   - Update the onboarding tools to use the parser
   - Write integration tests for the tools
   - Verify functionality

4. **Week 4: Documentation Migration**
   - Extract content from existing documentation
   - Create all AI-specific documentation files
   - Ensure cross-references

5. **Week 5: Testing and Deployment**
   - Run full test suite
   - Fix any issues found
   - Document the new system
   - Deploy the changes

## Success Criteria

1. All onboarding tools use content from documentation files
2. No duplication between code and documentation
3. Documentation is structured for both human and AI consumption
4. All workflows and roles have dedicated documentation
5. Tests verify that documentation changes are reflected in tool outputs