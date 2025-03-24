# Issue Cards: AI-Optimized Command Line Issue Tracking Tool

## Overview
Issue Cards is a lightweight command-line issue tracking tool specifically designed for AI coding agents and human developers to manage tasks efficiently. It focuses on providing clear context, sequencing, and verification steps for tasks within issues, all stored as plain markdown files in a project directory.

## Core Concepts

### Issues
- Self-contained units of work
- Stored as individual markdown files
- Contains metadata, description, and a sequence of tasks
- Automatically moved to closed/ directory when all tasks are finished
- Intended to be focused enough that an AI or human developer can complete without additional context

### Tasks
- Linear sequence of work items within an issue
- Uses Markdown task syntax (`- [ ]` for incomplete, `- [x]` for complete)
- Strictly sequenced in the order they appear in the file
- Can be tagged to apply pre-defined "wrappers" with additional required steps
- Tasks are marked as the "current" task based on their position (first uncompleted task)

### Tags
- Apply common patterns to tasks (like testing requirements)
- Define additional steps that appear as regular tasks to the user
- These tag-defined steps don't exist in the actual issue file until completed
- Configurable at the project level via template files
- Examples: unit-test, e2e-test, lint-and-commit, update-docs

## Directory Structure

```
.issues/
├── config/
│   ├── templates/
│   │   ├── issue/
│   │   │   ├── feature.md
│   │   │   ├── bugfix.md
│   │   │   ├── refactor.md
│   │   │   └── audit.md
│   │   └── tag/
│   │       ├── unit-test.md
│   │       ├── e2e-test.md
│   │       ├── lint-and-commit.md
│   │       └── update-docs.md
├── open/
│   ├── issue-0001.md
│   └── issue-0002.md
└── closed/
    └── issue-0000.md
```

## Issue Structure

Each issue contains:

- Title and issue number
- "Problem to be solved" section - Detailed description of what needs to be addressed
- "Planned approach" section - High-level strategy for solving the issue
- "Failed approaches" section - For logging attempts that didn't work during implementation
- "Questions to resolve" section - Open questions that need answers before or during implementation
- "Tasks" section - Markdown task list with sequential steps to complete the issue
- "Instructions" section - Additional context, rules, constraints, or guidance for implementation
- "Next steps" section (optional) - Preview of upcoming tasks (informational only)

Example:
```markdown
# Issue 0001: Implement user authentication

## Problem to be solved
Users need to be able to securely log into the application.

## Planned approach
Use JWT tokens with secure cookie storage and implement proper password hashing.

## Failed approaches
- Tried using localStorage for token storage but found security vulnerabilities

## Questions to resolve
- What is the token expiration time?

## Tasks
- [ ] Create user model with password field #unit-test
- [ ] Implement password hashing and verification
- [ ] Create login endpoint #e2e-test
- [ ] Add JWT token generation
- [ ] Implement authentication middleware #unit-test

## Instructions
Follow the project's security guidelines when implementing authentication.
The JWT should include the user's role permissions.

## Next steps
Once authentication is complete, we'll implement:
- Authorization middleware for protected routes
- User profile management
```

## Issue Templates
The system includes templates for common issue types with appropriate sections and sample content:

### Feature Template
```markdown
# Issue {NUMBER}: {TITLE}

## Problem to be solved
[Detailed description of the feature needed]

## Planned approach
[High-level strategy for implementing the feature]

## Failed approaches
[Document approaches that were tried but didn't work]

## Questions to resolve
[List of questions that need answers]

## Tasks
- [ ] First task to implement the feature
- [ ] Second task to implement the feature

## Instructions
[Additional context or requirements for implementation]

## Next steps
[Future work after this feature is complete - informational only]
```

### Bugfix Template
```markdown
# Issue {NUMBER}: Fix {TITLE}

## Problem to be solved
[Detailed description of the bug and its impact]

## Planned approach
[Strategy for resolving the bug]

## Failed approaches
[Document approaches that were tried but didn't fix the bug]

## Questions to resolve
[Questions about the bug or its fix]

## Tasks
- [ ] Reproduce the bug with a test #unit-test
- [ ] Fix the bug
- [ ] Verify the fix

## Instructions
[Context, reproduction steps, expected behavior]

## Next steps
[Future related work - informational only]
```

### Refactor Template
```markdown
# Issue {NUMBER}: Refactor {TITLE}

## Problem to be solved
[What needs to be improved in the current implementation]

## Planned approach
[Strategy for refactoring]

## Failed approaches
[Document approaches that didn't work]

## Questions to resolve
[Questions about the refactoring]

## Tasks
- [ ] First refactoring task #unit-test
- [ ] Second refactoring task

## Instructions
[Performance goals, code style requirements, etc.]

## Next steps
[Future improvements - informational only]
```

### Audit Template
```markdown
# Issue {NUMBER}: Audit {TITLE}

## Problem to be solved
[Area to be audited and why]

## Planned approach
[Methodology for the audit]

## Failed approaches
[Approaches that didn't yield results]

## Questions to resolve
[Questions about the audit area]

## Tasks
- [ ] Review component X
- [ ] Document findings
- [ ] Recommend improvements

## Instructions
[What to look for, areas of concern, standards to check against]

## Next steps
[Implementation of recommendations - informational only]
```

## Tag Structure

Tags define additional steps that "wrap" the actual task implementation:

```markdown
# unit-test

## Steps
- Write failing unit tests for the functionality 
- Run the unit tests and verify they fail for the expected reason
- [ACTUAL TASK GOES HERE]
- Run unit tests and verify they now pass
- Make sure test coverage meets project requirements
```

Example tag templates:

### unit-test
```markdown
# unit-test

## Steps
- Write failing unit tests for the functionality
- Run the unit tests and verify they fail for the expected reason
- [ACTUAL TASK GOES HERE]
- Run unit tests and verify they now pass
- Make sure test coverage meets project requirements
```

### e2e-test
```markdown
# e2e-test

## Steps
- Write failing end-to-end test that verifies the expected behavior
- Run the test and verify it fails correctly
- [ACTUAL TASK GOES HERE]
- Run the end-to-end test and verify it passes
- Verify the feature works in the full application context
```

### lint-and-commit
```markdown
# lint-and-commit

## Steps
- [ACTUAL TASK GOES HERE]
- Run the project's linter and fix any issues
- Run the code formatter
- Commit your changes with a descriptive message following the project's commit style
```

### update-docs
```markdown
# update-docs

## Steps
- [ACTUAL TASK GOES HERE]
- Update relevant documentation to reflect changes
- Update comments in the code
- If API changes were made, update API documentation
```

## CLI Commands

The tool provides these core commands:

- `issue-cards init` - Set up the issue tracking system in a project
  - Creates the necessary directory structure
  - Copies default templates for issues and tags
  - Initializes the numbering system for issues

- `issue-cards create <template> --title "Issue title" [options]` - Create a new issue from a template
  - Automatically assigns the next issue number
  - Creates a new markdown file in the open/ directory
  - Applies the chosen template (feature, bugfix, refactor, audit)
  - Accepts options to populate all issue sections in a single command:
    - `--problem` - Detailed description of the problem to solve
    - `--approach` - High-level strategy for solving the issue
    - `--failed-approaches` - List of approaches already tried (one per line)
    - `--questions` - Open questions that need answers (one per line)
    - `--tasks` - List of tasks to implement (one per line, can include #tags)
    - `--instructions` - Guidelines to follow during implementation
    - `--next-steps` - Future work after this issue (one item per line)

- `issue-cards list` - Show all open issues
  - Lists all issues in the open/ directory with their numbers and titles
  - Indicates which issue is currently being worked on (if any)

- `issue-cards show [issue-number]` - Show details of current or specified issue
  - If no issue number is provided, shows the current issue being worked on
  - Displays the full content of the issue markdown file

- `issue-cards current` - Show the current task being worked on
  - Identifies the first uncompleted task in the current issue
  - If the task has tags, expands it into multiple tasks
  - Shows relevant context from the issue (Problem, Instructions, Failed approaches)
  - Shows any failed approaches from the issue to help guide implementation

- `issue-cards next` - Show what to work on next (after current task is completed)
  - Shows the next task in sequence
  - Expands tag-related steps if applicable

- `issue-cards complete-task` - Mark the current task as complete and show next task
  - Updates the issue file, changing `- [ ]` to `- [x]` for the current task
  - Automatically calls `issue-cards next` to show the next task
  - If all tasks are complete, moves the issue from open/ to closed/
  - Stages any changes to git if the project uses git

- `issue-cards add-task <description> [--before|--after] [--tags "tag1,tag2"]` - Add a new task
  - Adds a new task to the current issue
  - Can be positioned before or after the current task (default is after)
  - Optionally applies tags to the new task

- `issue-cards add-note <note>` - Add a note to the current issue
  - Appends the note to the Failed approaches or Questions sections based on content

- `issue-cards log-failure <description>` - Log a failed approach to the current issue
  - Explicitly adds an entry to the Failed approaches section
  - Useful for documenting approaches that didn't work during implementation

- `issue-cards add-question <question>` - Add a question to the current issue
  - Explicitly adds an entry to the Questions to resolve section
  - Useful for documenting questions that arise during implementation

- `issue-cards templates [template-name]` - Show available templates formatted as create commands
  - With no arguments, lists all available issue templates
  - With template name argument, shows template details and a ready-to-use create command
  - Makes it easy to view and use available templates
  - Formats output as executable commands that can be copied directly

- `issue-cards help` - Show help for all commands
  - Lists all available commands with descriptions
  - When used with a specific command (`issue-cards help create`), shows detailed help
  - Always includes project-specific examples

## Task Workflow with Tag Expansion

When a task has tags, the tag steps and the main task are seamlessly combined:

1. User runs `issue-cards current` on a task with a tag (e.g., `#unit-test`)
2. System shows an expanded task list with all steps to complete (no distinction between tag steps and main task)
3. User completes all the tasks in the list
4. User runs `issue-cards complete-task`
5. System marks the entire task (including all expanded steps) as complete
6. System automatically shows the next task

Example output for a task with the unit-test tag:

```
COMMAND: issue-cards current

TASK: Create user model with password field #unit-test

CONTEXT:
Problem to be solved:
Users need to be able to securely log into the application.

Failed approaches:
- Tried using localStorage for token storage but found security vulnerabilities
- Tried using Firebase Auth but it doesn't support our custom user data needs

Instructions:
Follow the project's security guidelines when implementing authentication.
The JWT should include the user's role permissions.

TASKS:
1. Write failing unit tests for the user model
2. Run the unit tests and verify they fail for the expected reason
3. Create user model with password field
4. Run unit tests and verify they now pass
5. Make sure test coverage meets project requirements

UPCOMING TASKS:
- Implement password hashing and verification
- Create login endpoint #e2e-test
- Add JWT token generation
- Implement authentication middleware #unit-test

Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.
```

## Next Steps Context

When displaying tasks, the system shows upcoming tasks as context:

```
COMMAND: issue-cards current

TASK: Create user model with password field #unit-test

CONTEXT:
Problem to be solved:
Users need to be able to securely log into the application.

Failed approaches:
- Tried using localStorage for token storage but found security vulnerabilities

Instructions:
Follow the project's security guidelines when implementing authentication.
The JWT should include the user's role permissions.

TASKS:
1. Write failing unit tests for the user model
2. Run the unit tests and verify they fail for the expected reason
3. Create user model with password field
4. Run unit tests and verify they now pass
5. Make sure test coverage meets project requirements

UPCOMING TASKS:
- Implement password hashing and verification
- Create login endpoint #e2e-test
- Add JWT token generation
- Implement authentication middleware #unit-test

Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.
```

## Workflow Example

1. Developer runs `issue-cards init` to set up the system
2. Developer creates a new issue with `issue-cards create feature --title "Implement user authentication"`
3. Developer runs `issue-cards current` to see what to work on
4. System shows a task list that includes any tag-related steps seamlessly integrated
5. Developer works on all the tasks shown
6. Developer runs `issue-cards complete-task` when done
7. System marks the task as complete and automatically shows the next task
8. When all tasks are complete, the issue is automatically moved to closed/

## Git Integration

- If the project uses git, all changes made to issue files are automatically staged
- The system detects git by checking for a .git directory in the project
- When files are updated:
  - The system runs `git add <file>` on the modified issue file
  - No automatic commits are made; committing remains the user's responsibility

## Implementation Details

### Storage
- All storage is plain text in markdown files
- No external dependencies or databases required
- Issue numbering follows a simple sequential pattern (0001, 0002, etc.)
- Current issue/task state is determined by examining task completion in open issues

### Tag Steps Integration
- Tag steps are never written to the issue file
- They are seamlessly integrated into the task list when a user runs `issue-cards current`
- When the user marks them as complete with `issue-cards complete-task`, the system only records the original task as complete
- The user is not aware of which steps come from tags versus which were in the original task

### Context Display
When showing the current task, the system:
1. Extracts the task description
2. Includes relevant sections from the issue (Problem, Instructions, Failed approaches)
3. Shows any failed approaches to help avoid repeating ineffective solutions
4. Expands tag-related steps directly into the task list
5. Shows upcoming tasks as an informational preview

### LLM Optimization
- All outputs use plain text/markdown for maximum compatibility with LLMs
- Help command (`--help`) provides example usage for all commands
- Commands follow predictable patterns for easy tool calling
- All commands have predictable outputs for easy parsing
- When used with AI agents, the outputs provide all necessary context in one response

## Command Line Interface Design

### Output Formatting

Each command produces standardized output sections:

```
COMMAND: issue-cards current

TASK: Create user model with password field #unit-test

CONTEXT:
Problem to be solved:
Users need to be able to securely log into the application.

Failed approaches:
- Tried using localStorage for token storage but found security vulnerabilities
- Tried using Firebase Auth but it doesn't support our custom user data needs

Instructions:
Follow the project's security guidelines when implementing authentication.
The JWT should include the user's role permissions.

TASKS:
1. Write failing unit tests for the user model
2. Run the unit tests and verify they fail for the expected reason
3. Create user model with password field
4. Run unit tests and verify they now pass
5. Make sure test coverage meets project requirements

UPCOMING TASKS:
- Implement password hashing and verification
- Create login endpoint #e2e-test
- Add JWT token generation
- Implement authentication middleware #unit-test

Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.
```

### Help System

The help system is optimized for use by both humans and LLMs:

```
$ issue-cards --help

Issue Cards - AI-Optimized Issue Tracking

Commands:
  init                  Initialize issue tracking in this project
  create <template>     Create a new issue from template
  list                  List all open issues
  show [issue-number]   Show issue details
  current               Show current task with context
  next                  Show next task to work on
  complete-task         Mark current task complete and show next
  add-task              Add a new task to current issue
  add-note              Add a note to current issue
  log-failure           Log a failed approach to the current issue
  add-question          Add a question to the current issue
  help                  Show help information

Examples for this project:
  issue-cards create feature --title "Add search functionality"
  issue-cards current
  issue-cards complete-task
  issue-cards add-task "Update API documentation" --tags "update-docs"
  issue-cards log-failure "Tried using localStorage but it was vulnerable to XSS"
```

## Detailed Command Examples

### Initialize Issue Tracking System

```
$ issue-cards init

✅ Initialized issue tracking system in .issues/
✅ Created config templates
✅ Ready to create your first issue
```

### Creating an Issue with Complete Details

Basic creation with title only:
```
$ issue-cards create feature --title "Add user authentication"

✅ Created Issue #0001: Add user authentication in .issues/open/issue-0001.md
```

Complete creation with all sections filled in:
```
$ issue-cards create feature \
  --title "Add user authentication" \
  --problem "Users need to securely log in to access their personalized content. Currently, the app is read-only with no user-specific features." \
  --approach "We'll implement JWT-based authentication with secure password storage using bcrypt. Tokens will be stored in httpOnly cookies." \
  --failed-approaches "Tried using localStorage but it was vulnerable to XSS attacks
Tried using Firebase Auth but it doesn't support our custom user data needs" \
  --questions "What should the JWT expiration time be?
Should we support social login (Google, GitHub)?" \
  --instructions "Follow OWASP security guidelines. Include CSRF protection. Rate-limit login attempts." \
  --tasks "Create User model and database schema #unit-test
Create user registration endpoint with input validation #e2e-test
Implement secure password hashing with bcrypt #unit-test
Create login endpoint with JWT token generation #e2e-test
Implement authentication middleware
Create logout functionality
Add password reset workflow #e2e-test" \
  --next-steps "After authentication is complete:
- Implement user profiles
- Add role-based authorization
- Set up email verification"

✅ Created Issue #0001: Add user authentication in .issues/open/issue-0001.md
✅ Added 7 tasks to the issue with their respective tags
```

The created issue file would contain:
```markdown
# Issue 0001: Add user authentication

## Problem to be solved
Users need to securely log in to access their personalized content. Currently, the app is read-only with no user-specific features.

## Planned approach
We'll implement JWT-based authentication with secure password storage using bcrypt. Tokens will be stored in httpOnly cookies.

## Failed approaches
- Tried using localStorage but it was vulnerable to XSS attacks
- Tried using Firebase Auth but it doesn't support our custom user data needs

## Questions to resolve
- What should the JWT expiration time be?
- Should we support social login (Google, GitHub)?

## Tasks
- [ ] Create User model and database schema #unit-test
- [ ] Create user registration endpoint with input validation #e2e-test
- [ ] Implement secure password hashing with bcrypt #unit-test
- [ ] Create login endpoint with JWT token generation #e2e-test
- [ ] Implement authentication middleware
- [ ] Create logout functionality
- [ ] Add password reset workflow #e2e-test

## Instructions
Follow OWASP security guidelines. Include CSRF protection. Rate-limit login attempts.

## Next steps
After authentication is complete:
- Implement user profiles
- Add role-based authorization
- Set up email verification
```

### Listing Issues

```
$ issue-cards list

Open Issues:
  ⚡ #0001: Add user authentication (current)
    Current task: Create User model and database schema
  
  #0002: Fix password reset email not sending
    Current task: Reproduce the bug with test case
  
  #0003: Refactor API error handling
    Current task: Create consistent error response structure

Total: 3 open issues
```

### Showing Issue Details

```
$ issue-cards show 1

# Issue 0001: Add user authentication

## Problem to be solved
Users need to securely log in to access their personalized content. Currently, the app is read-only with no user-specific features.

## Planned approach
We'll implement JWT-based authentication with secure password storage using bcrypt. Tokens will be stored in httpOnly cookies.

## Failed approaches
- Tried using localStorage but it was vulnerable to XSS attacks

## Questions to resolve
- What should the JWT expiration time be?

## Tasks
- [ ] Create User model and database schema #unit-test
- [ ] Create user registration endpoint with input validation #e2e-test
- [ ] Implement secure password hashing with bcrypt #unit-test
- [ ] Create login endpoint with JWT token generation #e2e-test
- [ ] Implement authentication middleware
- [ ] Create logout functionality
- [ ] Add password reset workflow #e2e-test

## Instructions
Follow OWASP security guidelines. Include CSRF protection. Rate-limit login attempts.

## Next steps
After authentication is complete:
- Implement user profiles
- Add role-based authorization
- Set up email verification
```

### Working with the Current Task

Showing the current task:
```
$ issue-cards current

COMMAND: issue-cards current

TASK: Create User model and database schema #unit-test

CONTEXT:
Problem to be solved:
Users need to securely log in to access their personalized content. Currently, the app is read-only with no user-specific features.

Failed approaches:
- Tried using localStorage but it was vulnerable to XSS attacks

Instructions:
Follow OWASP security guidelines. Include CSRF protection. Rate-limit login attempts.

TASKS:
1. Write failing unit tests for the User model
2. Include tests for validation, password handling, and required fields
3. Run the tests and verify they fail for the expected reason
4. Create User model and database schema
5. Run the unit tests and verify they now pass
6. Make sure the database schema includes indexes for performance
7. Ensure password field is properly set up for secure storage

UPCOMING TASKS:
- Create user registration endpoint with input validation #e2e-test
- Implement secure password hashing with bcrypt #unit-test
- Create login endpoint with JWT token generation #e2e-test
- Implement authentication middleware
- Create logout functionality
- Add password reset workflow #e2e-test

Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.
```

Completing the current task:
```
$ issue-cards complete-task

✅ Completed: Create User model and database schema

NEXT TASK: Create user registration endpoint with input validation #e2e-test

CONTEXT:
Problem to be solved:
Users need to securely log in to access their personalized content. Currently, the app is read-only with no user-specific features.

Failed approaches:
- Tried using localStorage but it was vulnerable to XSS attacks

Instructions:
Follow OWASP security guidelines. Include CSRF protection. Rate-limit login attempts.

TASKS:
1. Write a failing end-to-end test for the registration endpoint
2. Include tests for validation, error cases, and successful registration
3. Run the test and verify it fails correctly
4. Create user registration endpoint with input validation
5. Run the end-to-end test and verify it passes
6. Verify the feature works in the full application context

UPCOMING TASKS:
- Implement secure password hashing with bcrypt #unit-test
- Create login endpoint with JWT token generation #e2e-test
- Implement authentication middleware
- Create logout functionality
- Add password reset workflow #e2e-test

Note: The above upcoming tasks are for context only. Do not work on them until they become the current task.
```

### Adding Tasks

Adding a task after the current one:
```
$ issue-cards add-task "Add email uniqueness validation" --tags "unit-test"

✅ Added task: Add email uniqueness validation #unit-test
```

Adding a task before the current one:
```
$ issue-cards add-task "Set up database connection" --before

✅ Added task: Set up database connection
⚠️ This is now your current task
```

### Adding Notes and Logging Failures

Adding notes to the issue:
```
$ issue-cards add-note "Tried using Firebase Auth but it doesn't support our custom user data needs"

✅ Added to Failed approaches:
- Tried using Firebase Auth but it doesn't support our custom user data needs
```

```
$ issue-cards add-note "Should we support social login (Google, GitHub)?"

✅ Added to Questions to resolve:
- Should we support social login (Google, GitHub)?
```

Explicitly logging a failed approach:
```
$ issue-cards log-failure "Tried using the bcrypt implementation from crypto-js but it was too slow for our needs"

✅ Added to Failed approaches:
- Tried using the bcrypt implementation from crypto-js but it was too slow for our needs
```

Adding a question:
```
$ issue-cards add-question "What should be the password reset token expiration time?"

✅ Added to Questions to resolve:
- What should be the password reset token expiration time?
```

### Viewing Available Templates

Listing all available templates:
```
$ issue-cards templates

Available issue templates:

FEATURE TEMPLATE
issue-cards create feature --title "Your title here" \
  --problem "Describe the feature needed" \
  --approach "High-level strategy for implementation" \
  --tasks "First task to implement
Second task to implement" \
  --instructions "Additional requirements"

BUGFIX TEMPLATE
issue-cards create bugfix --title "Your bug title here" \
  --problem "Describe the bug and its impact" \
  --approach "Strategy for fixing the bug" \
  --tasks "Reproduce bug with a test #unit-test
Fix the bug
Verify the fix" \
  --instructions "Reproduction steps, expected behavior"

REFACTOR TEMPLATE
issue-cards create refactor --title "Your refactor title here" \
  --problem "What needs to be improved" \
  --approach "Strategy for refactoring" \
  --tasks "First refactoring task #unit-test
Second refactoring task" \
  --instructions "Performance goals, code style requirements"

AUDIT TEMPLATE
issue-cards create audit --title "Your audit title here" \
  --problem "Area to be audited and why" \
  --approach "Methodology for the audit" \
  --tasks "Review component X
Document findings
Recommend improvements" \
  --instructions "What to look for, areas of concern"
```

Viewing a specific template with details:
```
$ issue-cards templates feature

FEATURE TEMPLATE

Description:
Use this template for new features or enhancements.

Usage:
issue-cards create feature --title "Your title here" \
  --problem "Describe the feature needed in detail. What problem does it solve? Why is it needed?" \
  --approach "High-level strategy for implementing the feature. What technical approach will you take?" \
  --failed-approaches "Any approaches already tried that didn't work" \
  --questions "Open questions that need answers" \
  --tasks "First task to implement the feature
Second task to implement the feature
Third task with testing #unit-test" \
  --instructions "Additional context or requirements for implementation" \
  --next-steps "Future work after this feature is complete"

Example:
issue-cards create feature --title "Add user search" \
  --problem "Users need to be able to search for other users by name or email." \
  --approach "We'll implement a search endpoint with indexing on the user table." \
  --tasks "Create search endpoint
Add search form in UI
Implement search results page #e2e-test" \
  --instructions "Search should be case-insensitive and support partial matching."
```

### Help for Specific Commands

```
$ issue-cards help create

Command: issue-cards create <template> [options]

Creates a new issue from a template.

Arguments:
  template          Template to use (feature, bugfix, refactor, audit)

Options:
  --title           Issue title (required)
  --problem         Description of the problem to solve
  --approach        Planned approach for solving the issue
  --failed-approaches List of approaches already tried (one per line)
  --questions       List of questions that need answers (one per line)
  --instructions    Guidelines to follow during implementation
  --tasks           List of tasks, one per line. Add #tag to tag tasks
  --next-steps      Future work (for context only)

Examples:
  issue-cards create feature --title "Add user search"
  
  issue-cards create bugfix --title "Fix login redirect" \
    --problem "After login, users are not redirected to the original page" \
    --failed-approaches "Tried storing the URL in a cookie but it was too large" \
    --tasks "Reproduce the issue #unit-test
    Store original URL before login
    Implement redirect after successful login"

  # Create a complete issue with all sections in one command
  issue-cards create feature --title "User Authentication" \
    --problem "Users need to securely log in..." \
    --approach "We'll implement JWT-based authentication..." \
    --failed-approaches "Tried using localStorage..." \
    --questions "What should be the JWT expiration time?" \
    --tasks "Create User model #unit-test
    Create login endpoint #e2e-test" \
    --instructions "Follow OWASP security guidelines..." \
    --next-steps "Implement user profiles"
```

### Completing an Issue

When all tasks are completed:
```
$ issue-cards complete-task

✅ Completed: Add password reset workflow
🎉 All tasks complete! Issue #0001 has been closed.

Would you like to work on another issue? Run:
  issue-cards list
```