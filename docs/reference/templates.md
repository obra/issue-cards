# Issue and Tag Templates

Issue Cards uses two types of templates:
1. **Issue Templates** - Define the structure of new issues
2. **Tag Templates** - Define additional steps for tasks with specific tags

## Issue Templates

Issue templates define the sections and default content for new issues. They are stored in `.issues/config/templates/issue/`.

### Available Issue Templates

The system comes with four default issue templates:

#### Feature Template

Used for new features or enhancements.

```markdown
# Issue {NUMBER}: {TITLE}

## Problem to be solved
{PROBLEM}

## Planned approach
{APPROACH}

## Failed approaches
{FAILED_APPROACHES}

## Questions to resolve
{QUESTIONS}

## Tasks
{TASKS}

## Instructions
{INSTRUCTIONS}

## Next steps
{NEXT_STEPS}
```

#### Bugfix Template

Used for bug fixes.

```markdown
# Issue {NUMBER}: Fix {TITLE}

## Problem to be solved
{PROBLEM}

## Planned approach
{APPROACH}

## Failed approaches
{FAILED_APPROACHES}

## Questions to resolve
{QUESTIONS}

## Tasks
{TASKS}

## Instructions
{INSTRUCTIONS}

## Next steps
{NEXT_STEPS}
```

#### Refactor Template

Used for code refactoring tasks.

```markdown
# Issue {NUMBER}: Refactor {TITLE}

## Problem to be solved
{PROBLEM}

## Planned approach
{APPROACH}

## Failed approaches
{FAILED_APPROACHES}

## Questions to resolve
{QUESTIONS}

## Tasks
{TASKS}

## Instructions
{INSTRUCTIONS}

## Next steps
{NEXT_STEPS}
```

#### Audit Template

Used for code audits or reviews.

```markdown
# Issue {NUMBER}: Audit {TITLE}

## Problem to be solved
{PROBLEM}

## Planned approach
{APPROACH}

## Failed approaches
{FAILED_APPROACHES}

## Questions to resolve
{QUESTIONS}

## Tasks
{TASKS}

## Instructions
{INSTRUCTIONS}

## Next steps
{NEXT_STEPS}
```

### Issue Template Placeholders

All issue templates use these standard placeholders:

- `{NUMBER}`: Automatically filled with the next issue number
- `{TITLE}`: Filled with the title provided when creating the issue
- `{PROBLEM}`: Description of the problem to solve
- `{APPROACH}`: High-level strategy for implementing the solution
- `{FAILED_APPROACHES}`: List of approaches already tried that didn't work
- `{QUESTIONS}`: Questions that need answers before or during implementation
- `{TASKS}`: List of tasks to complete the issue
- `{INSTRUCTIONS}`: Guidelines to follow during implementation
- `{NEXT_STEPS}`: Future work after this issue is completed

## Tag Templates

Tag templates define additional steps that "wrap around" a task when it includes a specific expansion tag (using the `+` prefix) at the end of the task (e.g., `+unit-test`). They are stored in `.issues/config/templates/tag/`.

### Available Tag Templates

The system comes with four default tag templates:

#### unit-test

Expands a task to include unit testing steps.

```markdown
# unit-test

## Steps
- Write failing unit tests for the functionality
- Run the unit tests and verify they fail for the expected reason
- [ACTUAL TASK GOES HERE]
- Run unit tests and verify they now pass
- Make sure test coverage meets project requirements
```

#### e2e-test

Expands a task to include end-to-end testing steps.

```markdown
# e2e-test

## Steps
- Write failing end-to-end test that verifies the expected behavior
- Run the test and verify it fails correctly
- [ACTUAL TASK GOES HERE]
- Run the end-to-end test and verify it passes
- Verify the feature works in the full application context
```

#### lint-and-commit

Expands a task to include linting and committing steps.

```markdown
# lint-and-commit

## Steps
- [ACTUAL TASK GOES HERE]
- Run the project's linter and fix any issues
- Run the code formatter
- Commit your changes with a descriptive message following the project's commit style
```

#### update-docs

Expands a task to include documentation updates.

```markdown
# update-docs

## Steps
- [ACTUAL TASK GOES HERE]
- Update relevant documentation to reflect changes
- Update comments in the code
- If API changes were made, update API documentation
```

### Tag Template Structure

Each tag template must:

1. Have a name matching the tag used (e.g., "unit-test" for the `+unit-test` tag)
2. Include a short description of the template's purpose after the name (using blockquote format)
3. Contain a "Steps" section with steps listed as markdown list items
4. Include the placeholder `[ACTUAL TASK GOES HERE]` where the original task description should be inserted

Important requirements for using tag templates:

1. Expansion tags must use the `+` prefix (not `#`)
2. Expansion tags must appear at the end of the task text
3. Multiple expansion tags can be combined (e.g., `+unit-test +update-docs`)

## Using Templates

### Using Issue Templates

```bash
# Create a new issue using the feature template
issue-cards create feature --title "Add user authentication"

# View available issue templates
issue-cards templates --type issue

# View details of a specific template
issue-cards templates feature
```

### Using Tag Templates

```bash
# Add a task with an expansion tag
issue-cards add-task "Create user model +unit-test"

# When viewing the current task, the tag steps will be expanded:
issue-cards current
# Shows: 
# 1. Write failing unit tests for the functionality
# 2. Run the unit tests and verify they fail...
# 3. Create user model
# 4. Run the unit tests and verify they now pass
# 5. Make sure test coverage meets project requirements

# Combine multiple expansion tags
issue-cards add-task "Create user model +unit-test +update-docs"

# View available tag templates
issue-cards templates --type tag

# View details of a specific tag template
issue-cards templates unit-test
```

## Creating Custom Templates

### Custom Issue Templates

1. Create a new markdown file in `.issues/config/templates/issue/`
2. Follow the structure of the existing templates
3. Include all the required section placeholders
4. Use the new template with `issue-cards create <your-template> --title "..."`

### Custom Tag Templates

1. Create a new markdown file in `.issues/config/templates/tag/`
2. Include a heading with the tag name (without the `+` prefix)
3. Add a "Steps" section with a list of steps
4. Include `[ACTUAL TASK GOES HERE]` where the original task should be inserted
5. Use the new tag at the end of your task text: `issue-cards add-task "Do something +your-tag"`

## Template Validation

You can validate templates to ensure they follow the required structure:

```bash
# Validate all templates
issue-cards templates --validate

# Validate a specific template
issue-cards templates feature --validate
```

The validation checks for:
- Required sections in issue templates
- Required placeholders in issue templates
- Required "Steps" section in tag templates
- Required task placeholder in tag templates