// ABOUTME: Comprehensive MCP command sequences for ticket creation workflow
// ABOUTME: Contains complete start-to-finish sequences with examples

# Ticket Creation Workflow: Complete MCP Command Sequences

## Overview

This document provides comprehensive MCP command sequences for creating and managing tickets (issues) in issue-cards. It covers the entire lifecycle from initial creation to task completion, with detailed examples and best practices.

## Ticket Creation Process Flow

The complete issue creation and management flow follows these steps:

1. **Preparation**: Understand requirements and gather information
2. **Issue Creation**: Create a well-structured issue with proper metadata
3. **Task Definition**: Define clear, actionable tasks with appropriate tagging
4. **Issue Organization**: Organize and prioritize tasks in logical sequence
5. **Issue Initialization**: Set the issue as current to begin work
6. **Task Implementation**: Work on tasks sequentially, tracking progress
7. **Issue Maintenance**: Update the issue as work progresses
8. **Issue Completion**: Close the issue when all tasks are complete

## Complete MCP Command Sequences

### 1. Basic Ticket Creation Sequence

This sequence covers the essential steps for creating a new ticket with basic information:

```json
[
  // 1. Check available issue templates
  {
    "tool": "mcp__listTemplates",
    "args": { "type": "issue" }
  },
  
  // 2. Create a new feature issue
  {
    "tool": "mcp__createIssue",
    "args": {
      "template": "feature",
      "title": "Implement user authentication system",
      "problem": "Users need a secure way to identify themselves in the application",
      "approach": "Create a JWT-based authentication system with secure credential storage",
      "task": [
        "Research authentication best practices",
        "Design user authentication flow",
        "Implement user authentication API"
      ]
    }
  },
  
  // 3. Check that the issue was created successfully
  {
    "tool": "mcp__listIssues",
    "args": { "state": "open" }
  },
  
  // 4. Set the new issue as current
  {
    "tool": "mcp__setCurrentIssue", 
    "args": { "issueNumber": "0001" }
  },
  
  // 5. View the current task
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

### 2. Comprehensive Ticket Creation with TDD

This sequence creates a feature ticket with detailed tasks following Test-Driven Development principles:

```json
[
  // 1. Check available issue templates
  {
    "tool": "mcp__listTemplates",
    "args": { "type": "issue" }
  },
  
  // 2. Check available tag templates for testing
  {
    "tool": "mcp__listTemplates",
    "args": { "type": "tag" }
  },
  
  // 3. Create a comprehensive feature issue with TDD tasks
  {
    "tool": "mcp__createIssue",
    "args": {
      "template": "feature",
      "title": "Implement user authentication system",
      "problem": "Users need a secure way to identify themselves in the application",
      "approach": "Create a JWT-based authentication system following TDD principles",
      "task": [
        "Research authentication libraries and security best practices",
        "Design user authentication data model +unit-test",
        "Implement user repository layer +unit-test",
        "Create authentication service with token generation +unit-test",
        "Implement login/register API endpoints +unit-test",
        "Create authentication middleware for route protection +unit-test",
        "Integrate authentication components +integration-test",
        "Create login form component +unit-test",
        "Create registration form component +unit-test",
        "Implement client-side form validation +unit-test",
        "Connect authentication forms with API +integration-test",
        "Implement complete authentication flow +e2e-test",
        "Create documentation for authentication API and usage +update-docs"
      ]
    }
  },
  
  // 4. Set the new issue as current
  {
    "tool": "mcp__setCurrentIssue", 
    "args": { "issueNumber": "0001" }
  },
  
  // 5. Add additional context to the issue
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Implementation notes",
      "note": "We should follow OWASP security guidelines for authentication implementation: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html"
    }
  },
  
  // 6. Add specific questions to resolve
  {
    "tool": "mcp__addQuestion",
    "args": {
      "question": "Should we support social login providers in addition to email/password?"
    }
  },
  
  // 7. View the current task to start work
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

### 3. Bug Ticket Creation Sequence

This sequence creates a ticket for bug fixing with proper reproduction steps and testing:

```json
[
  // 1. Create a bug issue with reproduction steps
  {
    "tool": "mcp__createIssue",
    "args": {
      "template": "bugfix",
      "title": "Fix user session expiration not working correctly",
      "problem": "User sessions aren't properly expiring after the configured timeout period",
      "approach": "Investigate token validation and expiration handling in the authentication service",
      "task": [
        "Reproduce the session expiration issue consistently",
        "Create test that demonstrates the expiration bug +unit-test",
        "Debug the token validation and expiration code",
        "Fix the session expiration implementation",
        "Verify the fix with automated tests",
        "Add additional test cases to prevent regression +unit-test"
      ]
    }
  },
  
  // 2. Add additional context about the bug
  {
    "tool": "mcp__setCurrentIssue", 
    "args": { "issueNumber": "0002" }
  },
  
  // 3. Add reproduction context
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Problem to be solved",
      "note": "Reproduction steps:\n1. Log in as any user\n2. Check 'Remember me' option\n3. Wait for the 30-minute session timeout configured in .env\n4. Observe that the user is still logged in when they should be logged out\n5. This happens in all environments (dev, staging, prod)"
    }
  },
  
  // 4. Start working on the first task
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

### 4. Task Addition and Refinement Sequence

This sequence shows how to add, organize, and refine tasks within an existing issue:

```json
[
  // 1. View the current issue to understand the context
  {
    "tool": "mcp__showIssue",
    "args": { "issueNumber": "0001" }
  },
  
  // 2. Add a new task at a specific position
  {
    "tool": "mcp__addTask",
    "args": {
      "issueNumber": "0001",
      "description": "Add password strength meter to registration form +unit-test",
      "at": 10
    }
  },
  
  // 3. Add a task that should be completed before another task
  {
    "tool": "mcp__addTask",
    "args": {
      "issueNumber": "0001",
      "description": "Create test environment with mock authentication service",
      "at": 1
    }
  },
  
  // 4. Add a task with its own subtasks
  {
    "tool": "mcp__addTask",
    "args": {
      "issueNumber": "0001",
      "description": "Implement security monitoring for authentication endpoints +unit-test",
      "after": true
    }
  },
  
  // 5. Refresh the view of the issue
  {
    "tool": "mcp__showIssue",
    "args": { "issueNumber": "0001" }
  }
]
```

### 5. Task Implementation and Progress Tracking Sequence

This sequence demonstrates how to document progress through task implementation:

```json
[
  // 1. Get the current task
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  },
  
  // 2. Document implementation approach
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "For the user repository layer, I'll implement a clean interface with the following methods:\n- createUser(userData): User\n- findUserById(id): User\n- findUserByEmail(email): User\n- updateUser(id, userData): User\n- validateCredentials(email, password): boolean"
    }
  },
  
  // 3. Document a failed approach
  {
    "tool": "mcp__logFailure",
    "args": {
      "approach": "Initially tried to implement user repository with direct database queries",
      "reason": "This approach would make testing difficult; instead, we should use a repository pattern with dependency injection to enable easier unit testing"
    }
  },
  
  // 4. Ask a clarifying question
  {
    "tool": "mcp__addQuestion",
    "args": {
      "question": "Should the user repository handle password hashing, or should that be handled by the authentication service?"
    }
  },
  
  // 5. Document implementation details
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Implementation notes",
      "note": "Implemented user repository with the following:\n- Used bcrypt for password hashing with cost factor 12\n- Added unique index on email field for performance\n- Implemented soft deletion for user accounts\n- Added created_at and updated_at timestamps\n- Ensured all methods have proper error handling"
    }
  },
  
  // 6. Mark the task as complete
  {
    "tool": "mcp__completeTask",
    "args": {}
  },
  
  // 7. Get the next task
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

### 6. Issue Completion Sequence

This sequence shows the steps for completing an issue:

```json
[
  // 1. Complete the final task
  {
    "tool": "mcp__completeTask",
    "args": {}
  },
  
  // 2. Add final implementation notes
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Implementation notes",
      "note": "All authentication components have been implemented and tested. The system now supports:\n- Email/password authentication\n- JWT token-based sessions\n- Password reset via email\n- Account lockout after failed attempts\n- Secure password storage with bcrypt\n- CSRF protection\n- Complete e2e test coverage"
    }
  },
  
  // 3. Check if all tasks are complete
  {
    "tool": "mcp__showIssue",
    "args": { "issueNumber": "0001" }
  },
  
  // 4. List all issues to see the closed issue
  {
    "tool": "mcp__listIssues",
    "args": { "state": "all" }
  },
  
  // 5. Choose a new issue to work on
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "0002" }
  },
  
  // 6. View the current task of the new issue
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

## Specialized Ticket Creation Patterns

### Test-Driven Development Ticket

Follow this pattern when creating TDD-focused tickets:

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Feature with focus on test-first development",
    "problem": "Clear problem statement focusing on user needs",
    "approach": "Test-driven approach with red-green-refactor cycle",
    "task": [
      // Start with research and planning
      "Research existing solutions and best practices",
      
      // Define the data model with TDD
      "Write tests for data model +unit-test",
      
      // Implement core services with TDD
      "Write tests for core service A +unit-test",
      "Write tests for core service B +unit-test",
      
      // Test component interactions
      "Write integration tests for service interactions +integration-test",
      
      // Add UI components with TDD
      "Write tests for UI component A +unit-test",
      "Write tests for UI component B +unit-test",
      
      // Create end-to-end tests for the full feature
      "Write end-to-end tests for the complete feature +e2e-test",
      
      // Document the feature
      "Create documentation for the feature +update-docs"
    ]
  }
}
```

### Refactoring Ticket

Use this pattern for creating code refactoring tickets:

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "refactor",
    "title": "Refactor authentication service for better maintainability",
    "problem": "Current authentication code is difficult to test and maintain",
    "approach": "Apply SOLID principles and improve test coverage",
    "task": [
      // Start with analysis
      "Analyze current code structure and identify issues",
      "Create tests that capture current behavior +unit-test",
      
      // Refactor with incremental improvements
      "Refactor authentication service into smaller classes",
      "Improve error handling and add comprehensive logging",
      "Add dependency injection for better testability",
      
      // Verify refactoring with tests
      "Verify refactored code passes all existing tests",
      "Add additional test coverage for edge cases +unit-test",
      
      // Documentation
      "Update API documentation to reflect changes",
      "Create architecture diagram of refactored components"
    ]
  }
}
```

## Best Practices for Ticket Creation

### Structuring Issues

1. **Clear Title**: Use action-oriented titles that describe what will be done
   ```
   ✅ "Implement user authentication system"
   ❌ "Authentication"
   ```

2. **Problem-Focused**: Focus on the problem to be solved, not the solution
   ```
   ✅ "Users need a secure way to identify themselves in the application"
   ❌ "Create JWT authentication"
   ```

3. **Actionable Tasks**: Create clear, specific tasks with unambiguous completion criteria
   ```
   ✅ "Implement login endpoint with email/password validation"
   ❌ "Create authentication"
   ```

4. **Logical Ordering**: Order tasks by dependency and complexity
   ```
   ✅ "1. Research libraries → 2. Design model → 3. Implement repository → 4. Create service"
   ❌ "Random unordered tasks"
   ```

5. **Task Size**: Keep tasks small enough to complete in 1-2 hours of work
   ```
   ✅ "Implement email validation for registration form"
   ❌ "Implement entire user registration system"
   ```

### Using Tags Effectively

1. **Test Tags**: Use test tags to enforce test-first development
   ```
   ✅ "Implement email validation +unit-test"
   ✅ "Create user registration flow +e2e-test"
   ```

2. **Documentation Tags**: Mark tasks requiring documentation updates
   ```
   ✅ "Update API documentation for new endpoints +update-docs"
   ```

3. **Multiple Tags**: Combine tags for complex tasks
   ```
   ✅ "Implement authentication workflow +unit-test +integration-test +e2e-test"
   ```

### Documentation Within Issues

1. **Clear Context**: Provide adequate context in the problem statement
   ```
   ✅ "Problem: Mobile users cannot reset their password because the reset email is not mobile-friendly"
   ```

2. **Implementation Notes**: Document important decisions
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Implementation notes",
       "note": "Decided to use JWT with 15-minute expiration and refresh tokens for better security"
     }
   }
   ```

3. **Asked Questions**: Record questions and their answers
   ```json
   {
     "tool": "mcp__addQuestion",
     "args": {
       "question": "Should we support OAuth providers? If yes, which ones have priority?"
     }
   }
   ```

## Command Sequence Templates

### New Feature Development

```json
[
  {
    "tool": "mcp__createIssue",
    "args": {
      "template": "feature",
      "title": "[FEATURE TITLE]",
      "problem": "[PROBLEM STATEMENT]",
      "approach": "[PLANNED APPROACH]",
      "task": [
        "Research and requirements gathering",
        "Design the feature with diagrams and specifications",
        "Create test plan for the feature +unit-test",
        "Implement core components +unit-test",
        "Create UI components +unit-test",
        "Integrate components +integration-test",
        "Implement end-to-end functionality +e2e-test",
        "Update documentation +update-docs"
      ]
    }
  },
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "[ISSUE_NUMBER]" }
  },
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

### Bug Fix

```json
[
  {
    "tool": "mcp__createIssue",
    "args": {
      "template": "bugfix",
      "title": "Fix [ISSUE DESCRIPTION]",
      "problem": "[DETAILED PROBLEM WITH REPRODUCTION STEPS]",
      "approach": "Investigate and fix the root cause",
      "task": [
        "Reproduce the issue consistently",
        "Create test that demonstrates the bug +unit-test",
        "Debug and identify root cause",
        "Implement fix",
        "Verify fix resolves the issue",
        "Add regression tests +unit-test"
      ]
    }
  },
  {
    "tool": "mcp__setCurrentIssue",
    "args": { "issueNumber": "[ISSUE_NUMBER]" }
  },
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
]
```

## Complete Ticket Lifecycle Example

This example walks through a complete ticket lifecycle from creation to completion:

1. **Create the issue**:
   ```json
   {
     "tool": "mcp__createIssue",
     "args": {
       "template": "feature",
       "title": "Implement password reset functionality",
       "problem": "Users need a way to reset forgotten passwords",
       "approach": "Email-based password reset with secure tokens",
       "task": [
         "Design password reset flow and security measures",
         "Create token generation service +unit-test",
         "Implement reset request API endpoint +unit-test",
         "Create email template for reset instructions",
         "Implement token verification API endpoint +unit-test",
         "Create password reset form UI +unit-test",
         "Implement end-to-end password reset flow +e2e-test",
         "Add documentation for password reset API +update-docs"
       ]
     }
   }
   ```

2. **Set it as current**:
   ```json
   {
     "tool": "mcp__setCurrentIssue",
     "args": { "issueNumber": "0001" }
   }
   ```

3. **View the first task**:
   ```json
   {
     "tool": "mcp__getCurrentTask",
     "args": {}
   }
   ```

4. **Document your approach**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Planned approach",
       "note": "For the password reset flow, we'll use the following approach:\n1. User requests password reset via email\n2. Generate a secure, time-limited token (1 hour expiry)\n3. Send email with reset link containing the token\n4. When link is clicked, verify token validity\n5. If valid, allow user to set a new password\n6. Invalidate all sessions for security"
     }
   }
   ```

5. **Complete the task**:
   ```json
   {
     "tool": "mcp__completeTask",
     "args": {}
   }
   ```

6. **Document implementation for second task**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Implementation notes",
       "note": "Implemented token generation service with:\n- 32 byte random token using crypto.randomBytes\n- SHA-256 hashing of tokens stored in database\n- One hour expiration time\n- One-time use enforcement\n- Association with user ID\n- Automatic cleanup of expired tokens"
     }
   }
   ```

7. **Document a failed approach**:
   ```json
   {
     "tool": "mcp__logFailure",
     "args": {
       "approach": "Initially tried using JWT for reset tokens",
       "reason": "JWTs can't be invalidated server-side, which is a security risk for password reset"
     }
   }
   ```

8. **Complete the second task**:
   ```json
   {
     "tool": "mcp__completeTask",
     "args": {}
   }
   ```

9. **Continue until all tasks are complete**

10. **After completing final task, add summary**:
    ```json
    {
      "tool": "mcp__addNote",
      "args": {
        "section": "Implementation notes",
        "note": "Password reset functionality has been fully implemented with the following features:\n- Secure token generation and verification\n- Email delivery with instructions\n- Mobile-friendly reset form\n- Password strength requirements\n- Comprehensive security measures\n- Full test coverage\n- API documentation"
      }
    }
    ```

## Conclusion

Following these command sequences ensures a consistent, structured approach to issue creation and management. These patterns help create well-organized issues with clear tasks, proper documentation, and effective progress tracking. For more specific guidance on TDD-focused ticket creation, see [TDD Task Sequences](../best-practices/tdd-task-sequences.md).