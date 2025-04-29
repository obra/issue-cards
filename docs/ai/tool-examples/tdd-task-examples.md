// ABOUTME: Examples of TDD task structures and test tagging patterns
// ABOUTME: Includes real-world examples for different test types and applications

# TDD Task Structure Examples

## Overview

This guide provides examples of properly structured tasks using Test-Driven Development (TDD) practices in issue-cards. Following these patterns ensures consistent application of TDD across your project.

## Basic TDD Task Patterns

### Component-Level Unit Testing

When implementing a new component with unit tests:

```
Implement UserProfile component +unit-test
```

Expands to:
1. Write failing unit tests for the UserProfile component
2. Run the unit tests and verify they fail for the expected reason
3. Implement UserProfile component
4. Run unit tests and verify they now pass
5. Make sure test coverage meets project requirements

### End-to-End Testing

When implementing user-facing functionality that requires complete workflow testing:

```
Add user registration flow +e2e-test
```

Expands to:
1. Write failing end-to-end test that verifies the expected behavior
2. Run the test and verify it fails correctly
3. Add user registration flow
4. Run the end-to-end test and verify it passes
5. Verify the feature works in the full application context

### Integration Testing

When implementing functionality that involves multiple components:

```
Implement data synchronization between services +integration-test
```

Expands to:
1. Write failing integration tests for component interactions (RED phase)
2. Run the integration tests and verify they fail as expected
3. Implement data synchronization between services (GREEN phase)
4. Run integration tests and verify they now pass
5. Refactor the implementation while keeping tests passing (REFACTOR phase)
6. Verify component integration in the broader system context

### Combined Testing Approaches

For critical functionality requiring multiple testing approaches:

```
Implement password reset functionality +unit-test +integration-test +e2e-test
```

Expands to:
1. Write failing unit tests for password reset functionality
2. Run the unit tests and verify they fail for the expected reason
3. Implement password reset functionality
4. Run unit tests and verify they now pass
5. Refactor implementation while keeping unit tests passing
6. Make sure unit test coverage meets project requirements
7. Write failing integration tests for component interactions
8. Run the integration tests and verify they fail as expected
9. Implement component integrations for password reset
10. Run integration tests and verify they now pass
11. Refactor the implementation while keeping integration tests passing
12. Verify component integration in the broader system
13. Write failing end-to-end test that verifies the password reset flow
14. Run the e2e test and verify it fails correctly
15. Verify end-to-end functionality
16. Run the end-to-end test and verify it passes
17. Refactor implementation while maintaining e2e test passing status
18. Verify the feature works in the full application context

## Real-World TDD Task Examples

### Frontend Component Implementation

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Create DataTable component with sorting and filtering +unit-test"
  }
}
```

Example test implementation notes:
```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Created the following test cases:\n1. DataTable renders with provided columns and data\n2. Clicking column header sorts the table\n3. Filtering narrows displayed rows based on search term\n4. Empty state displays when no data matches filters\n5. Loading state displays during data fetch"
  }
}
```

### API Endpoint Development

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0002",
    "description": "Implement user search API endpoint +unit-test"
  }
}
```

Example test implementation notes:
```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Created test suite for user search endpoint:\n1. Returns matching users when search query is provided\n2. Paginates results correctly\n3. Handles special characters in search terms\n4. Returns empty array when no matches found\n5. Validates authorization requirements\n6. Rate limits excessive requests\n7. Returns appropriate error responses for invalid queries"
  }
}
```

### Service Integration Implementation

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0002",
    "description": "Implement data sync between inventory and order services +integration-test"
  }
}
```

Example test implementation notes:
```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Created integration tests for inventory-order sync:\n1. Order creation decreases available inventory\n2. Inventory updates are reflected in open orders\n3. Canceling an order returns items to inventory\n4. Concurrent orders correctly handle inventory limitations\n5. Failed inventory operations roll back order changes\n6. System recovers from network interruptions\n7. Events are properly sequenced across services"
  }
}
```

### Full User Flow Implementation

```json
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0003",
    "description": "Implement user onboarding workflow +e2e-test"
  }
}
```

Example test implementation notes:
```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Test implementation",
    "note": "Created end-to-end tests for complete onboarding flow:\n1. User can register with valid credentials\n2. Verification email is sent and can be verified\n3. Profile completion form validates required fields\n4. User preferences are saved correctly\n5. User is redirected to appropriate dashboard after completion\n6. Returning user sees completed onboarding state"
  }
}
```

## TDD in Different Application Types

### Backend Service Implementation

**Task Example**:
```
Implement caching service for frequently accessed data +unit-test
```

**Key Test Categories**:
- Cache hit/miss behavior
- Cache invalidation
- Concurrent access
- Memory usage boundaries
- Fallback behavior

### Frontend Component Library

**Task Example**:
```
Implement form validation library +unit-test
```

**Key Test Categories**:
- Input validation rules
- Error message display
- Form submission handling
- Accessibility compliance
- Integration with form libraries

### Database Schema Changes

**Task Example**:
```
Add user roles and permissions schema +unit-test
```

**Key Test Categories**:
- Schema migration
- Query performance
- Data integrity constraints
- Backward compatibility
- Access control validation

## Creating a Complete TDD Issue

When creating a new feature with proper TDD structure, include a mix of unit tests, integration tests, and end-to-end tests:

```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement user authentication system",
    "problem": "Users need a secure way to authenticate with our application",
    "approach": "Build JWT-based authentication with role-based access control",
    "task": [
      "Design authentication data model and schema +unit-test",
      "Implement user registration endpoint +unit-test",
      "Implement login endpoint with JWT token generation +unit-test",
      "Create authentication middleware for protected routes +unit-test",
      "Implement password reset functionality +unit-test +e2e-test",
      "Create login and registration UI components +unit-test",
      "Integrate frontend forms with backend authentication +e2e-test",
      "Implement role-based access control +unit-test",
      "Add account lockout after failed attempts +unit-test +e2e-test",
      "Document authentication API and usage +update-docs"
    ]
  }
}
```

## Breaking Down TDD Cycles

### Example: Authentication Form Validation

**Task**: `Implement form validation for login and registration forms +unit-test`

#### Cycle 1: Email Validation

1. **Red**: Write test that email field validates format
   ```javascript
   test('validates email format', () => {
     // Arrange
     render(<RegistrationForm />);
     // Act
     fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
     fireEvent.blur(emailInput);
     // Assert
     expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
   });
   ```

2. **Green**: Implement minimal email validation
   ```javascript
   function validateEmail(email) {
     return /\S+@\S+\.\S+/.test(email);
   }
   ```

3. **Refactor**: Improve validation and error messages
   ```javascript
   function validateEmail(email) {
     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
     return emailRegex.test(email);
   }
   ```

#### Cycle 2: Password Validation

1. **Red**: Write test that password meets requirements
   ```javascript
   test('validates password minimum requirements', () => {
     // Arrange
     render(<RegistrationForm />);
     // Act
     fireEvent.change(passwordInput, { target: { value: 'short' } });
     fireEvent.blur(passwordInput);
     // Assert
     expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
   });
   ```

2. **Green**: Implement minimal password validation
   ```javascript
   function validatePassword(password) {
     return password.length >= 8;
   }
   ```

3. **Refactor**: Add strength requirements
   ```javascript
   function validatePassword(password) {
     const hasMinLength = password.length >= 8;
     const hasNumber = /\d/.test(password);
     const hasSpecial = /[!@#$%^&*]/.test(password);
     return hasMinLength && (hasNumber || hasSpecial);
   }
   ```

## Best Practices Illustrated

### 1. Keep Tests Focused and Independent

Good example of independent test:
```javascript
test('validates email format independently', () => {
  expect(validateEmail('test@example.com')).toBe(true);
  expect(validateEmail('invalid-email')).toBe(false);
});
```

### 2. Add Comments for Test Intent

Good example with clear intent:
```javascript
// Test that password validation requires minimum length and complexity
test('validates password complexity requirements', () => {
  expect(validatePassword('short')).toBe(false); // Too short
  expect(validatePassword('longenough')).toBe(false); // Long but no numbers/special
  expect(validatePassword('longenough123')).toBe(true); // Meets requirements
});
```

### 3. Consistent Task Naming

Pattern for consistent task naming:
- `Implement [component/feature] +unit-test`
- `Create [component/feature] +unit-test`
- `Add [component/feature] +e2e-test`
- `Fix [bug/issue] in [component/feature] +unit-test`

### 4. Document Each TDD Phase

Using `mcp__addNote` to document TDD phases:
```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Red phase",
    "note": "Created failing tests for email validation that verify valid formats are accepted and invalid formats are rejected with appropriate error messages"
  }
}
```

## Complete Task Flow Examples

### Unit Test Example: Form Validation

1. **Current task**: `Implement form validation for registration form +unit-test`

2. **Document Red phase**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Test implementation",
       "note": "Created tests for form validation:\n- validateEmail rejects invalid email formats\n- validatePassword enforces minimum length (8 chars)\n- validatePassword requires at least one number\n- validateConfirmPassword checks passwords match\n- Form shows appropriate error messages for each validation failure"
     }
   }
   ```

3. **Document Green phase**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Implementation notes",
       "note": "Implemented validation functions:\n- Added basic regex for email validation\n- Added length and character checks for password\n- Added password matching check\n- Connected validators to form fields\n- Added error message display logic"
     }
   }
   ```

4. **Document Refactor phase**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Refactoring",
       "note": "Improved implementation:\n- Extracted validation to FormValidator class\n- Improved regex patterns for better validation\n- Added more descriptive error messages\n- Added client-side validation on both change and blur events\n- Improved accessibility by adding aria-invalid attributes"
     }
   }
   ```

5. **Mark task complete**:
   ```json
   {
     "tool": "mcp__completeTask",
     "args": {}
   }
   ```

### End-to-End Test Example: User Registration

1. **Current task**: `Implement user registration flow +e2e-test`

2. **Document Red phase**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Test implementation",
       "note": "Created end-to-end tests:\n- User can navigate to registration page\n- Form validates input fields correctly\n- Successful submission creates account\n- User receives welcome email\n- User is redirected to onboarding\n- Duplicate email shows appropriate error"
     }
   }
   ```

3. **Document Green phase**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Implementation notes",
       "note": "Implemented registration flow:\n- Created RegisterPage component\n- Added form with validation\n- Connected to authentication API\n- Added success/error handling\n- Implemented email verification\n- Added redirect to onboarding page"
     }
   }
   ```

4. **Document Refactor phase**:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Refactoring",
       "note": "Improved implementation:\n- Enhanced form accessibility\n- Added loading states and animations\n- Improved error messages and recovery options\n- Added analytics tracking\n- Optimized validation performance\n- Added comprehensive form validation feedback"
     }
   }
   ```

5. **Mark task complete**:
   ```json
   {
     "tool": "mcp__completeTask",
     "args": {}
   }
   ```