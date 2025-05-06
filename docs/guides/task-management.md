# Task Management Guide

This guide provides practical advice for managing tasks effectively with issue-cards.

## Task Organization Strategies

### Planning Your Tasks

When creating issues, break down work into clear, manageable tasks:

```bash
# Create a feature issue with well-defined tasks
issue-cards create feature --title "Implement authentication system" \
  --task "Design authentication data model" \
  --task "Create database migrations" \
  --task "Implement user registration" \
  --task "Implement login/logout functionality" \
  --task "Add password reset capabilities" \
  --task "Implement authentication middleware"
```

Guidelines for good task planning:
- Each task should represent a single unit of work
- Tasks should be small enough to complete in a single sitting
- Order tasks logically by dependency
- Include testing steps for critical components

### Using Task Positions

Position tasks to maintain logical workflow:

```bash
# Add a task before the current task
issue-cards add-task "Setup test environment" --before

# Add a task after the current task
issue-cards add-task "Add input validation" --after

# Add a task at a specific position
issue-cards add-task "Update documentation" --at 3
```

## Task Tagging Best Practices

### When to Use Tags

Tags are most effective for:
- Standardizing testing workflows
- Ensuring documentation is updated
- Enforcing code quality steps
- Tracking review and approval processes

### Tag Combinations

Combine tags for complex workflows:

```bash
# Add task with multiple tags
issue-cards add-task "Implement user model #unit-test #update-docs"
```

This expands to include both test and documentation steps.

### Creating Custom Tags

Create tags for your team's specific needs:

```bash
# Create a custom code review tag
cat > templates/tag/code-review.md << 'EOF'
# code-review

## Steps
- Create a branch for the feature
- [ACTUAL TASK GOES HERE]
- Write unit tests with 80%+ coverage
- Create pull request
- Address reviewer feedback
- Merge the code
EOF

# Use the custom tag
issue-cards add-task "Implement authentication service #code-review"
```

## Task Context and Documentation

### Recording Important Context

Add relevant context as you work:

```bash
# Document design decisions
issue-cards add-note "We'll use JWT tokens stored in HTTP-only cookies for security"

# Record attempted approaches that didn't work
issue-cards log-failure "Tried using localStorage but vulnerable to XSS attacks"

# Ask questions that need answers
issue-cards add-question "What should be the token expiration time?"
```

### Collaborative Task Management

Effective practices for team collaboration:

1. **Keep tasks updated**: Complete tasks as you finish them
2. **Document roadblocks**: Use questions to flag issues needing input
3. **Share context**: Add notes for important decisions and considerations
4. **Record failed approaches**: Help others avoid repeated mistakes
5. **Use descriptive task names**: Make work visible and understandable

## Git Integration Workflow

Integrate task management with your Git workflow:

```bash
# Start work on a feature
issue-cards set-current --issue 42
issue-cards current

# Create feature branch based on issue
git checkout -b issue-42-auth-system

# Work on the task...

# Mark task complete
issue-cards complete-task

# Commit your changes
git add .
git commit -m "Implement user model and migrations"

# Continue with next task...
```

## Task Time Management

### Prioritizing Tasks

Strategies for effective prioritization:

1. **Front-load complex tasks**: Put difficult tasks early when energy is high
2. **Group related tasks**: Keep similar tasks together to maintain context
3. **Balance quick wins**: Mix in some easy tasks for steady progress
4. **Consider dependencies**: Order tasks to minimize blockers

### Tracking Progress

Monitor and maintain momentum:

```bash
# List all open issues to see overall progress
issue-cards list

# See your current task and upcoming work
issue-cards current

# Check a specific issue's progress
issue-cards show 42
```

## Advanced Task Management

### Batch Operations

Create multiple related tasks efficiently:

```bash
# Create issue with comprehensive tasks
issue-cards create feature --title "User profile system" \
  --task "Design database schema #unit-test" \
  --task "Create profile model #unit-test" \
  --task "Implement profile API endpoints #e2e-test" \
  --task "Create profile settings UI" \
  --task "Add profile photo upload #unit-test" \
  --task "Implement user preferences #e2e-test" \
  --task "Write documentation #update-docs"
```

### Task Dependencies

Handle task dependencies explicitly:

```bash
# Add a prerequisite
issue-cards add-task "Setup OAuth provider credentials" --before

# Add a follow-up task
issue-cards add-task "Clean up temporary testing accounts" --after
```

## Troubleshooting

### Fixing Task Order

If tasks are in the wrong order:

```bash
# View all tasks to see current order
issue-cards show

# Add a task at specific position
issue-cards add-task "Missing step" --at 3

# Complete a task to move forward
issue-cards complete-task
```

### Managing Complex Issues

For especially large issues:

1. Consider splitting into multiple smaller issues
2. Use clear task descriptions with specific outcomes
3. Add comprehensive context in the issue description
4. Update the issue with progress notes regularly

## Related Topics

- [Task Management Tutorial](../tutorials/task-management.md) - Step-by-step learning
- [Tag Expansion Reference](../reference/tag-expansion.md) - Detailed tag documentation
- [Common Workflows Guide](common-workflows.md) - Example-driven workflows