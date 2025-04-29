# TDD Workflow MCP Examples

This document provides comprehensive examples of using the Model Control Protocol (MCP) tools to implement Test-Driven Development workflows in issue-cards.

## Creating a TDD-Focused Issue

Use `mcp__createIssue` to create a new feature issue with tasks designed for Test-Driven Development:

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement user authentication system",
    "problem": "Users need a secure way to authenticate with our application",
    "approach": "Create a JWT-based authentication system following TDD principles",
    "task": [
      "Research authentication best practices",
      "Design user authentication data model +unit-test",
      "Implement user repository layer +unit-test",
      "Create authentication service +unit-test",
      "Implement login/register API endpoints +unit-test",
      "Create authentication middleware +unit-test",
      "Integrate authentication components +integration-test",
      "Implement complete authentication flow +e2e-test",
      "Document authentication API and usage +update-docs"
    ]
  }
}
```

## Complete TDD Workflow Example

This section provides a complete sequence of MCP commands for implementing a task using Test-Driven Development.

### 1. Get the Current Task

Start by getting your current task to identify what you need to implement:

```json
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

Example response (assuming the current task is TDD-related):
```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "issueTitle": "Implement user authentication system",
    "taskId": "task-2",
    "description": "Design user authentication data model +unit-test",
    "context": {
      "problem": "Users need a secure way to authenticate with our application",
      "approach": "Create a JWT-based authentication system following TDD principles"
    },
    "workflowGuidance": {
      "message": "🎯 Focus on implementing ONLY this task, following best practices.",
      "tddGuidance": {
        "message": "This task requires Test-Driven Development (Red-Green-Refactor cycle):",
        "tddSteps": [
          "🔴 RED: Write failing tests that define the expected behavior",
          "🟢 GREEN: Write the minimum code necessary to pass the tests",
          "🔄 REFACTOR: Improve the code while keeping tests passing"
        ]
      }
    }
  }
}
```

### 2. Document Your Testing Approach (Before Writing Tests)

Document your planned approach for writing tests:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "For the user authentication data model, I'll write tests that verify:\n\n1. User schema validates required fields (email, password)\n2. Email format is properly validated\n3. Passwords are properly hashed before storage\n4. Username uniqueness is enforced\n5. User roles can be assigned and validated"
  }
}
```

### 3. RED Phase: Document Test Implementation

After writing the failing tests, document what you've implemented:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Created the following tests for the user model:\n\n- testUserCreationRequiresEmail: Verifies user creation fails without valid email\n- testUserCreationRequiresPassword: Verifies user creation fails without password\n- testPasswordIsHashed: Verifies passwords are not stored in plaintext\n- testEmailMustBeUnique: Verifies duplicate emails are rejected\n- testUserRoleAssignment: Verifies roles can be assigned correctly\n\nAll tests currently fail because the User model doesn't exist yet."
  }
}
```

### 4. GREEN Phase: Document Implementation

After implementing the code to make tests pass:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Implementation notes",
    "note": "Implemented the User model with:\n\n- Schema with required email and password fields\n- Email validation using regex pattern\n- Password hashing using bcrypt with work factor 12\n- Unique index on the email field\n- Role field with validation for allowed roles\n- Created methods for authentication and role verification\n\nAll tests now pass with this implementation."
  }
}
```

### 5. REFACTOR Phase: Document Improvements

After refactoring your implementation while keeping tests passing:

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Refactoring",
    "note": "Refactored the User model implementation:\n\n- Extracted validation logic to separate validator methods\n- Improved error messages for validation failures\n- Added password complexity requirements\n- Enhanced role validation with hierarchy support\n- Optimized database indexes for common queries\n\nAll tests continue to pass after these improvements."
  }
}
```

### 6. Document Any Failed Approaches

If you tried approaches that didn't work, document them:

```json
{
  "tool": "mcp__logFailure",
  "args": {
    "approach": "Initially tried to implement password validation with simple regex pattern",
    "reason": "Too restrictive and didn't handle common special characters. Switched to a more comprehensive approach that balances security with usability."
  }
}
```

### 7. Complete the Task

When the implementation is done and all tests pass:

```json
{
  "tool": "mcp__completeTask",
  "args": {}
}
```

## Integration Testing Workflow Example

For tasks that require testing the integration between components:

### 1. Get the Integration Testing Task

```json
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

Example response:
```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "issueTitle": "Implement user authentication system",
    "taskId": "task-7",
    "description": "Integrate authentication components +integration-test"
  }
}
```

### 2. Document Integration Test Approach

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "For integration testing, I'll verify:\n\n1. Authentication service correctly interacts with User repository\n2. Token generation/validation works across service boundaries\n3. API endpoints correctly use authentication middleware\n4. Error handling works consistently across components\n5. Authentication flow works end-to-end with actual (non-mocked) components"
  }
}
```

### 3. Document Integration Test Implementation (RED Phase)

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Created integration tests that verify:\n\n- Authentication service can create users via repository\n- Login endpoint validates credentials and returns tokens\n- Protected endpoints reject unauthenticated requests\n- Token rotation works correctly across services\n- Error responses are consistent across authentication flow\n\nTests are failing because the integration points aren't implemented yet."
  }
}
```

### 4. Document Integration Implementation (GREEN Phase)

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Implementation notes",
    "note": "Implemented integration between components:\n\n- Connected authentication service to user repository\n- Integrated token service with authentication endpoints\n- Added middleware to protected routes\n- Implemented proper error handling across boundaries\n- Added service factory for consistent configuration\n\nAll integration tests now pass."
  }
}
```

## End-to-End Testing Workflow Example

For tasks that require full end-to-end testing of user flows:

### 1. Get the E2E Testing Task

```json
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}
```

Response showing an E2E test task:
```json
{
  "success": true,
  "data": {
    "issueNumber": "0001",
    "issueTitle": "Implement user authentication system",
    "taskId": "task-8",
    "description": "Implement complete authentication flow +e2e-test"
  }
}
```

### 2. Document E2E Test Implementation (RED Phase)

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Created end-to-end tests for authentication:\n\n- User can register with valid credentials\n- User cannot register with invalid/duplicate information\n- User can log in with valid credentials\n- User cannot access protected routes without authentication\n- User can log out and tokens are invalidated\n- Password reset flow works correctly\n\nTests are failing because the full UI implementation is incomplete."
  }
}
```

### 3. Document E2E Implementation (GREEN Phase)

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Implementation notes",
    "note": "Implemented full authentication UI and API:\n\n- Created registration form with client-side validation\n- Implemented login form with error handling\n- Added protected route components in the frontend\n- Implemented logout functionality\n- Created password reset request and confirmation pages\n- Connected all UI components to backend APIs\n\nAll E2E tests now pass, verifying the complete authentication flow."
  }
}
```

## Testing Specific Scenarios

### Testing Edge Cases

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Added tests for these edge cases:\n\n- Rate limiting after multiple failed login attempts\n- Session persistence across browser restarts\n- Token expiration and automatic refresh\n- Concurrent login from multiple devices\n- Account lockout with notification\n- Database failure recovery"
  }
}
```

### Testing Security Requirements

```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Implemented security tests for:\n\n- XSS protection with proper encoding\n- CSRF token validation\n- SQL injection prevention\n- Token tampering detection\n- Sensitive data exposure prevention\n- Brute force protection"
  }
}
```

## TDD Best Practices for issue-cards

When using issue-cards for Test-Driven Development:

1. **Use Appropriate Tag Templates**:
   - Use `+unit-test` for component/function-level testing
   - Use `+integration-test` for testing component interactions
   - Use `+e2e-test` for full user flow testing

2. **Document Each TDD Phase**:
   - Use `mcp__addNote` with section "Test implementation" for RED phase
   - Use `mcp__addNote` with section "Implementation notes" for GREEN phase
   - Use `mcp__addNote` with section "Refactoring" for REFACTOR phase

3. **Record Failed Approaches**:
   - Use `mcp__logFailure` to document approaches that didn't work

4. **Task Progression**:
   - Complete each task fully before moving to the next
   - Mark tasks complete with `mcp__completeTask` only when all tests pass

5. **Organize Tasks in TDD Sequence**:
   - Start with foundational model/component testing
   - Progress to integration testing
   - End with end-to-end testing

These patterns ensure consistent documentation and workflow when implementing features using Test-Driven Development.