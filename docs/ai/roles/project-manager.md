// ABOUTME: AI-specific documentation for project managers in issue-cards
// ABOUTME: Contains role guidance, workflow recommendations, and best practices

# Project Manager Onboarding

## Introduction
As a project manager using issue-cards, you'll be responsible for creating and organizing issues, defining tasks, and tracking progress. The system provides tools to help you plan work, document requirements, and monitor team progress.

## Recommended Workflows
- [Create Feature Issue](../workflows/create-feature.md) - For planning and tracking new features
- [Bugfix Workflow](../workflows/bugfix.md) - For managing bug fixes
- [Technical Audit](../workflows/audit.md) - For conducting technical reviews
- [Task Management](../workflows/task-management.md) - For organizing and tracking work items

## Ticket Creation Best Practices

When creating tickets (issues) in issue-cards, follow these guidelines to ensure clarity and effectiveness:

- **Choose the right template**: Select the appropriate template based on the work type:
  - `feature`: For new functionality or enhancements
  - `bugfix`: For fixing defects or unexpected behavior
  - `refactor`: For code improvements without changing behavior
  - `audit`: For technical assessments and reviews

- **Write clear titles**: Use action-oriented, specific titles that describe the outcome:
  - ✓ "Implement user authentication system"
  - ✓ "Fix login page performance issues" 
  - ✗ "User login" (too vague)
  - ✗ "Bug in authentication" (not specific enough)

- **Define detailed problem statements**: Explain the problem to be solved, including:
  - Current state or behavior
  - Required state or behavior
  - Business impact or user need
  - Constraints or requirements

- **Provide implementation approach**: Outline the proposed approach at a high level:
  - Technologies to use
  - Architectural decisions
  - Integration points
  - Potential alternatives considered

- **Structure work with tasks**: Break down the issue into tasks that:
  - Follow a logical sequence
  - Include research/design before implementation
  - Include testing and documentation steps
  - Apply appropriate tag templates for standardized workflows

## General Best Practices

- **Define clear problem statements**: Each issue needs a well-defined problem with context, impact, and success criteria
- **Break work into small tasks**: Tasks should be completable in 1-2 hours - large tasks should be broken down further
- **Include success criteria**: Define specific, measurable criteria that indicate when a task is complete
- **Add context information**: Provide background, technical constraints, and related work to help developers understand the bigger picture
- **Identify questions early**: Use the Questions section to capture uncertainties that need resolution before implementation
- **Use tag templates**: Add standardized workflows to tasks with the `+tag-name` syntax (e.g., `+unit-test`, `+e2e-test`)
- **Discover available tags**: Use `mcp__availableTags` to see available tag templates with descriptions
- **Prioritize tasks**: Order tasks logically by dependency and complexity to create a clear implementation path
- **Document decisions**: Use notes to capture important design decisions and their rationales

## Tool Usage Map

### Creating Issues

Use `mcp__createIssue` to create well-structured tickets. The example below demonstrates best practices for ticket creation:

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement user authentication system",
    "problem": "Currently, users cannot access personalized content because there is no authentication system in place. We need a secure authentication system that allows users to register, log in, and access their personalized dashboard. This is critical for the Q3 release and will impact user retention metrics.\n\nSuccess criteria:\n- Users can register with email/password\n- Users can log in securely\n- Authentication persists across sessions\n- Passwords are securely stored\n- Failed login attempts are rate-limited",
    "approach": "We will implement JWT-based authentication with the following components:\n- Backend REST API endpoints for registration and login\n- Secure password hashing using bcrypt with appropriate work factor\n- Redis for token blacklisting and rate limiting\n- Frontend forms with client-side validation\n- Secure HttpOnly cookies for token storage to prevent XSS\n\nWe considered OAuth integration but will defer that to a future enhancement.",
    "task": [
      "Research authentication libraries and best practices",
      "Design user schema and authentication flow diagram +unit-test",
      "Implement backend registration endpoint +unit-test",
      "Implement backend login endpoint +unit-test",
      "Create token validation middleware",
      "Implement frontend registration form +e2e-test",
      "Implement frontend login form +e2e-test",
      "Add password reset functionality",
      "Write integration tests for the authentication flow",
      "Document the authentication API and usage guidelines +update-docs"
    ]
  }
}
```

**Key elements of a good issue creation:**
- Descriptive, action-oriented title
- Problem statement with context, impact, and success criteria
- Detailed approach with technical considerations and alternatives
- Structured tasks in logical order with appropriate tag templates

### Viewing and Managing Issues

Use these tools to maintain an overview of project status and manage existing issues:

- **View all issues**: Use `mcp__listIssues` to see the current project status
  ```json
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  }
  ```
  Options for `state`: `"open"` (default), `"closed"`, or `"all"` to see issues in different states

- **Examine issue details**: Use `mcp__showIssue` to view comprehensive information
  ```json
  {
    "tool": "mcp__showIssue",
    "args": { "issueNumber": "0001" }
  }
  ```
  This shows all tasks, questions, notes, and other content in the specified issue

- **Set current issue**: Use `mcp__setCurrentIssue` to focus work on a specific issue
  ```json
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0001" }
  }
  ```
  This sets the context for tools that operate on the "current" issue

### Task Management

Use these tools to create and organize tasks within issues:

- **Add tasks**: Use `mcp__addTask` to create new tasks in existing issues
  ```json
  {
    "tool": "mcp__addTask",
    "args": {
      "issueNumber": "0001",
      "description": "Design user authentication schema with password reset flow +unit-test"
    }
  }
  ```
  Add standardized workflows by including tag templates (e.g., `+unit-test`) at the end of the task description

- **Discover workflow templates**: Use `mcp__availableTags` to see available tag templates
  ```json
  {
    "tool": "mcp__availableTags",
    "args": {}
  }
  ```
  This returns descriptions and usage information for all available tag templates

- **List templates**: Use `mcp__listTemplates` to see available issue templates
  ```json
  {
    "tool": "mcp__listTemplates",
    "args": { "type": "issue" }
  }
  ```
  Options for `type`: `"issue"` or `"tag"` to see different template types

### Communication and Documentation

Use these tools to provide context, answer questions, and document important information:

- **Add notes**: Use `mcp__addNote` to document important information
  ```json
  {
    "tool": "mcp__addNote",
    "args": {
      "issueNumber": "0001",
      "section": "Planned approach",
      "note": "After team discussion, we've decided to use JWT tokens stored in HttpOnly cookies rather than local storage for better security against XSS attacks."
    }
  }
  ```
  Common sections: `"Planned approach"`, `"Problem to be solved"`, or any custom section

- **Answer questions**: Use `mcp__addQuestion` to provide clarity
  ```json
  {
    "tool": "mcp__addQuestion",
    "args": {
      "issueNumber": "0001",
      "question": "Should we support social login providers like Google and GitHub?"
    }
  }
  ```
  Questions serve as a central place to track uncertainties and their resolutions

## Effective Ticket Planning Strategies

### Task Sequencing and Dependencies

When creating tasks for an issue, use these strategies to create an effective implementation plan:

1. **Start with research and design tasks**
   - Place research and exploration tasks first
   - Follow with architecture and design tasks
   - Include documentation of design decisions

2. **Implement core functionality before edge cases**
   - Begin with foundational components
   - Add extension points and variations later
   - Group related functionality together

3. **Include testing at appropriate points**
   - Add unit testing tasks alongside implementation (use `+unit-test` tag)
   - Add end-to-end tests for user-facing features (use `+e2e-test` tag)
   - Include security testing for sensitive features

4. **End with documentation and refinement**
   - Include documentation tasks (use `+update-docs` tag)
   - Add final quality checks (use `+lint-and-commit` tag)
   - Include deployment preparation tasks

### Using Tag Templates

Tag templates provide standardized task workflows that can be added to any task description using the `+tag-name` syntax. When you add a tag to a task, it will automatically expand into multiple sub-tasks.

#### Example: Adding a unit test workflow to a task

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Implement login form validation +unit-test"
  }
}
```

This will create a task with TDD workflow steps:
1. Write failing tests for login validation
2. Implement validation logic to pass tests
3. Refactor validation code while maintaining test coverage

#### Common Tag Templates

- **+unit-test**: Test-Driven Development workflow for unit testing
  - Ideal for: Core business logic, utility functions, data processing
  - When to use: For any code that needs thorough test coverage

- **+e2e-test**: End-to-end testing workflow for feature validation
  - Ideal for: User interfaces, multi-step workflows, critical user journeys
  - When to use: For user-facing features that span multiple components

- **+lint-and-commit**: Code quality checks before committing
  - Ideal for: Final polish, ensuring code standards
  - When to use: Before merging feature branches or submitting PRs

- **+update-docs**: Documentation update workflow
  - Ideal for: API changes, new features, configuration updates
  - When to use: Whenever changes affect how others use the system

#### Combining Tag Templates

You can combine multiple tag templates for complex tasks that require multiple workflows:

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Implement user registration API +unit-test +update-docs"
  }
}
```

This combines both unit testing and documentation workflows into a single task.