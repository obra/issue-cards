// ABOUTME: AI-specific documentation for developers in issue-cards
// ABOUTME: Contains role guidance, workflow recommendations, and best practices

# Developer Onboarding

## Introduction
As a developer using issue-cards, you'll be implementing tasks, documenting your work, and collaborating on issue tracking. The system provides tools to help you track your progress, document implementation decisions, and share information with your team.

## Recommended Workflows
- [Task Management](../workflows/task-management.md) - For working through assigned tasks
- [Bugfix Workflow](../workflows/bugfix.md) - For fixing issues in the codebase
- [Feature Implementation](../workflows/create-feature.md) - For contributing to feature development

## Working with Tickets and Tasks

Understanding how to interact with tickets (issues) and tasks is essential for effective development workflow. As a developer, you'll primarily work within existing tickets created by your team or project manager.

### Ticket and Task Lifecycle

1. **Ticket Creation**: Project managers or team leads create tickets (issues) that define problems to be solved
2. **Task Assignment**: Issues are broken down into specific tasks that represent units of work
3. **Task Implementation**: You implement the tasks, documenting your approach and any challenges
4. **Task Completion**: You mark tasks as complete when they meet the defined requirements
5. **Issue Closure**: After all tasks are completed, the issue can be closed

### Understanding Your Role

As a developer, you should:

- **Focus on assigned tasks**: Work through tasks in the order they're defined
- **Document implementation details**: Record technical decisions and approaches
- **Ask clarifying questions**: Seek clarification when requirements are ambiguous
- **Follow standardized workflows**: Use tag templates to ensure consistent processes
- **Maintain quality standards**: Include tests, documentation, and follow code conventions

## Task Implementation Best Practices

### Before Implementation

- **Understand the problem fully**: Read the entire ticket including problem statement and context
  - Look for success criteria to understand what "done" means
  - Review any linked resources or related tickets
  - Check existing code that may be affected by your changes

- **Ask clarifying questions early**: If requirements are unclear, use the Questions section
  ```json
  {
    "tool": "mcp__addQuestion",
    "args": {
      "question": "What specific password complexity requirements should we enforce?"
    }
  }
  ```

- **Plan your implementation approach**: Document your planned solution before coding
  ```json
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "I'll implement the login form validation using the zod library for schema validation with async server-side verification for credentials."
    }
  }
  ```

### During Implementation

- **Complete tasks sequentially**: Focus on one task at a time for better tracking and progress
  - Follow the order defined in the task list when possible
  - Complete all subtasks in tag templates in their defined order

- **Document important decisions**: Record key technical decisions and their rationale
  ```json
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "Decided to use JWT stored in HttpOnly cookies rather than localStorage for better XSS protection."
    }
  }
  ```

- **Record failed approaches**: Document methods that didn't work to help others avoid the same issues
  ```json
  {
    "tool": "mcp__logFailure",
    "args": {
      "approach": "Tried implementing server-side sessions with Redis",
      "reason": "Added too much complexity for our scale and increased latency in our serverless environment."
    }
  }
  ```

- **Break down complex tasks**: If a task is too large, consider asking to split it into smaller sub-tasks
  - Tasks should ideally be completable in 1-2 hours
  - Focus on discrete, testable units of functionality

### After Implementation

- **Follow quality standards**: Ensure your implementation meets expected quality criteria
  - Include appropriate unit and integration tests
  - Maintain code style and formatting conventions
  - Add meaningful comments for complex logic
  - Clean up debugging code and console.log statements

- **Update documentation**: Keep documentation in sync with implementation changes
  - Update READMEs, API docs, and other technical documentation
  - Add JSDoc comments for public functions and interfaces
  - Document any non-obvious behavior or edge cases

- **Mark tasks as complete**: Use `mcp__completeTask` when you've finished a task
  ```json
  {
    "tool": "mcp__completeTask",
    "args": {}
  }
  ```

## Developer Tool Usage Guide

The following tools help you manage your tasks efficiently throughout the development process.

### Task Management Tools

- **View your current task**: Use `mcp__getCurrentTask` to see what you should work on right now
  ```json
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  }
  ```
  This displays the current task with its description, its context in the issue, and upcoming tasks.

- **Complete current task**: Use `mcp__completeTask` when you've finished your current task
  ```json
  {
    "tool": "mcp__completeTask",
    "args": {}
  }
  ```
  This marks the current task as completed and shows the next task in the sequence.

- **View issue details**: Use `mcp__showIssue` to see the full issue context and all tasks
  ```json
  {
    "tool": "mcp__showIssue",
    "args": {
      "issueNumber": "0001"
    }
  }
  ```
  For the current issue, you can omit the issueNumber parameter.

### Documentation and Communication Tools

- **Ask questions**: Use `mcp__addQuestion` when you need clarification
  ```json
  {
    "tool": "mcp__addQuestion",
    "args": {
      "question": "Should the user password have minimum complexity requirements?"
    }
  }
  ```
  Questions become part of the issue and help document requirements and decisions.

- **Document implementation details**: Use `mcp__addNote` to record important information
  ```json
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "Using bcrypt for password hashing with a work factor of 12"
    }
  }
  ```
  Notes help maintain a record of how and why implementation decisions were made.

- **Record failed approaches**: Use `mcp__logFailure` to document what didn't work
  ```json
  {
    "tool": "mcp__logFailure",
    "args": {
      "approach": "Tried using localStorage for token storage",
      "reason": "Vulnerable to XSS attacks"
    }
  }
  ```
  Documenting failed approaches helps others learn from your experience.

### Workflow Templates

- **Find available tag templates**: Use `mcp__availableTags` to discover standardized workflows
  ```json
  {
    "tool": "mcp__availableTags",
    "args": {}
  }
  ```
  This returns descriptions and examples of all available tag templates.

## Working with Tag Templates

Tag templates provide standardized workflows that expand into multiple steps when a task uses the `+tag-name` syntax. As a developer, you'll frequently work with tasks that have these templates applied.

### Understanding Tag Workflows

When you see a task with a +tag suffix like "Implement login form +unit-test", you should:

1. **Check the expanded subtasks**: The task will expand into multiple steps
2. **Complete each step in order**: Each step builds on the previous one
3. **Mark each subtask complete**: Use `mcp__completeTask` after finishing each step
4. **Document your process**: Add notes about your implementation for each step

### Common Developer Tag Templates

- **+unit-test**: Test-Driven Development workflow
  1. Write failing tests for the feature
  2. Implement code to pass the tests 
  3. Refactor while maintaining test coverage
  
  **Best practices**:
  - Write tests that verify behavior, not implementation details
  - Ensure tests are deterministic and isolated
  - Aim for high coverage of critical code paths

- **+e2e-test**: End-to-end testing workflow
  1. Design test scenarios for the feature
  2. Implement end-to-end tests
  3. Implement the feature to pass tests
  4. Verify test coverage is adequate
  
  **Best practices**:
  - Focus on critical user journeys and flows
  - Test with realistic data and environments
  - Include both happy path and error cases

- **+lint-and-commit**: Code quality workflow
  1. Run linting tools on your changes
  2. Fix any style or quality issues
  3. Run tests to verify nothing is broken
  4. Commit your changes with a descriptive message
  
  **Best practices**:
  - Follow the project's code style conventions
  - Address all linter warnings, not just errors
  - Write clear, descriptive commit messages

- **+update-docs**: Documentation workflow
  1. Update relevant documentation files
  2. Ensure examples are accurate and working
  3. Update any related diagrams or images
  4. Cross-reference with other documentation
  
  **Best practices**:
  - Keep API documentation in sync with implementation
  - Include examples for non-obvious usage
  - Update both code comments and external docs

### Task Workflows in Practice

Here's an example of a complete task workflow using a tag template:

1. **Get your current task** with `mcp__getCurrentTask`
   ```
   Current Task: Implement form validation for login page +unit-test
   ```

2. **See the expanded subtasks**:
   - Write failing tests for form validation
   - Implement validation to pass tests
   - Refactor validation while maintaining test coverage

3. **Document your approach** for the first subtask:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Planned approach",
       "note": "Will use Jest and React Testing Library to test form validation behavior including email format, password requirements, and error messages."
     }
   }
   ```

4. **Complete each subtask in sequence**, marking each as complete:
   ```json
   {
     "tool": "mcp__completeTask",
     "args": {}
   }
   ```

5. **Document implementation details** as you progress:
   ```json
   {
     "tool": "mcp__addNote",
     "args": {
       "section": "Implementation notes",
       "note": "Form validation uses zod schema with custom validation messaging. Added error state styling for invalid fields."
     }
   }
   ```

By following these standardized workflows, you ensure consistent quality and make your work more predictable and maintainable.