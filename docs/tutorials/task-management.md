# Task Management Tutorial

This tutorial covers all aspects of task management in issue-cards. You'll learn how to add, organize, and complete tasks efficiently, as well as how to use the tag system to expand tasks with standardized steps.

## Understanding Tasks

Tasks in issue-cards are the individual units of work within an issue. They have several important characteristics:

- Tasks are stored in a strictly ordered list
- The first uncompleted task is always the "current" task
- Tasks can have tags that expand into sub-steps
- Completed tasks are marked with a checkbox (`[x]`)

## Adding Tasks

You can add tasks in several ways:

```bash
# Add a task to the end of the task list
issue-cards add-task "Implement user authentication"

# Add a task before the current task
issue-cards add-task "Set up test environment" --before

# Add a task after the current task
issue-cards add-task "Add error handling" --after

# Add a task at a specific position
issue-cards add-task "Update documentation" --at 3

# Add a task with a tag
issue-cards add-task "Create User model" --tags "unit-test"
```

You can also add tasks when creating an issue:

```bash
issue-cards create feature --title "New feature" \
  --task "Step 1" \
  --task "Step 2" \
  --task "Step 3"
```

## Working with the Current Task

The current task is always the first uncompleted task in the issue. To view it:

```bash
issue-cards current
```

This command shows:
- The current task description
- Expanded steps for any tagged tasks
- Relevant context from the issue
- Preview of upcoming tasks

When you've completed the current task:

```bash
issue-cards complete-task
```

This marks the task as done and shows you the next task.

## Using Task Tags

Tags add standardized steps to tasks. For example, adding `#unit-test` to a task:

```bash
issue-cards add-task "Create User model #unit-test"
```

When you view this task with `issue-cards current`, it expands to multiple steps:

```
TASK: Create User model #unit-test

TASKS:
1. Write failing unit tests for the User model
2. Run the tests and verify they fail for the expected reason
3. Create User model
4. Run the unit tests and verify they now pass
5. Make sure test coverage meets project requirements
```

Available tags include:
- `#unit-test` - Standard unit testing process
- `#e2e-test` - End-to-end testing process
- `#lint-and-commit` - Linting and committing process
- `#update-docs` - Documentation update process

## Adding Context to Tasks

As you work, you can add additional context:

```bash
# Add a question
issue-cards add-question "What format should we use for dates?"

# Log a failed approach
issue-cards log-failure "Tried using the X library but it had performance issues"

# Add a general note
issue-cards add-note "We should consider using Y library instead"
```

This context is shown when viewing the current task, providing valuable information for completing the work.

## Task Management Best Practices

1. **Create clear, atomic tasks** - Each task should represent one clear unit of work
2. **Use tags appropriately** - Add tags like `#unit-test` for standardized processes
3. **Log context as you go** - Document questions and failed approaches immediately
4. **Complete tasks in order** - Follow the sequence to maintain consistency
5. **Commit changes regularly** - If using Git, commit task completions and context additions

## Summary

In this tutorial, you've learned how to effectively manage tasks in issue-cards:

- Understanding the structure and order of tasks
- Adding tasks in different ways and positions
- Working with the current task system
- Using task tags to expand tasks with standardized steps
- Adding relevant context to tasks
- Following best practices for task management

These task management skills will help you track and complete work more efficiently.

## Related Topics

- [Tag Expansion Reference](../reference/tag-expansion.md)
- [Templates Customization](../guides/templates-customization.md)
- [Basic Workflow](basic-workflow.md)