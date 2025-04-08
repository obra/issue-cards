// ABOUTME: AI-specific examples of Claude integration with issue-cards
// ABOUTME: Contains practical examples for integrating Claude with issue-cards workflows

# Claude Integration Examples

This document provides specific examples of how Claude can effectively interact with issue-cards through MCP tools to assist in project management and development tasks.

## Conversational Patterns

### Project Analysis Workflow

This pattern shows how Claude can analyze a project and help plan work:

```
Human: I need to implement user authentication in my project. Can you help me plan this using issue-cards?

Claude: I'd be happy to help you plan a user authentication implementation using issue-cards. Let me help you create a feature issue with appropriate tasks.

First, I'll create a well-structured feature issue:

[Claude uses mcp__createIssue with detailed authentication implementation plan]

Now that we've created the issue, let's set it as your current issue and see what the first task is:

[Claude uses mcp__setCurrentIssue and mcp__getCurrentTask]

Your first task is to "Research authentication libraries and select the most appropriate one". Would you like me to help you with this research or provide guidance on what factors to consider?
```

### Bug Investigation Workflow

This pattern shows how Claude can help diagnose and fix bugs:

```
Human: We're getting an error in our application: "Cannot read property 'data' of undefined". Can you help me track this down?

Claude: I'll help you investigate this "Cannot read property 'data' of undefined" error. Let me help you create a bugfix issue to track our work.

[Claude uses mcp__createIssue with bugfix template]

This error typically occurs when you're trying to access the 'data' property of an object that is undefined. Let's add some investigative tasks:

[Claude uses mcp__addTask to add debugging steps]

Now let's set this issue as current and get started with our investigation:

[Claude uses mcp__setCurrentIssue and mcp__getCurrentTask]

The first step is to reproduce the issue. Can you tell me:
1. What specific page or component shows this error?
2. What sequence of actions triggers it?
3. Is it consistent or intermittent?

After we gather this information, I'll help you document it in the issue.
```

### Code Implementation Assistance

This pattern shows how Claude can help implement specific tasks:

```
Human: I need help implementing the current task in our project.

Claude: I'd be happy to help you implement your current task. Let me first check what task you're working on.

[Claude uses mcp__getCurrentTask]

I see you're working on "Implement JWT token authentication middleware". Let me understand the context:

Your current issue is about implementing user authentication, and you're specifically working on creating middleware to validate JWT tokens for protected routes.

Let me suggest an implementation approach:

[Claude suggests code implementation]

Would you like me to provide the code for this implementation?
```

### Review and Testing Workflow

This pattern shows how Claude can help with code review and testing:

```
Human: I've completed implementing the user authentication system. Can you help me verify it's implemented correctly and create appropriate tests?

Claude: I'd be happy to help you verify your authentication implementation and create appropriate tests. Let me first check the current issue to understand what we're working with.

[Claude uses mcp__showIssue or mcp__getCurrentTask]

I see you've implemented the user authentication system with JWT tokens. Let's document what we've completed and plan the testing approach.

[Claude uses mcp__addNote to document implementation details]

Now, let's create a testing plan. We should include:

1. Unit tests for each component
2. Integration tests for the authentication flow
3. Security tests to verify token handling

[Claude uses mcp__addTask to add testing tasks]

Would you like me to help you implement these tests, or would you prefer I review your existing implementation first?
```

### Documentation Workflow

This pattern shows how Claude can help with documentation:

```
Human: We need to document our new authentication system for other developers. Can you help?

Claude: I'd be happy to help you document your authentication system. Let me first gather information about the implementation.

[Claude uses mcp__showIssue to understand the authentication implementation]

Based on the implementation, I recommend creating comprehensive documentation covering:

1. Architecture overview
2. API endpoints
3. Authentication flow
4. Token handling
5. Security considerations
6. Example usage

[Claude uses mcp__addTask to add documentation tasks]

Would you like me to help draft this documentation now, or would you prefer to gather more specific details first?
```

## Best Practices for Claude Integration

### Getting Context First

Claude should always start by getting context before making suggestions:

1. Use `mcp__getCurrentTask` or `mcp__showIssue` to understand the current work
2. Reference existing notes and approaches in the issue
3. Ask clarifying questions about ambiguous requirements
4. Acknowledge constraints mentioned in the issue

### Documenting Reasoning

Claude should document its reasoning and recommendations:

1. Use `mcp__addNote` to document architectural decisions
2. Use `mcp__addQuestion` when encountering unclear requirements
3. Use `mcp__logFailure` to document approaches considered but rejected
4. Add detailed comments explaining complex implementations

### Working Systematically

Claude should help users work through tasks systematically:

1. Break down complex problems into manageable steps
2. Complete tasks in logical order
3. Document progress and decision points
4. Use appropriate task tags for testing and documentation
5. Complete tasks only when they're actually finished