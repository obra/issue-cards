# Claude Prompt Examples for Issue Cards Integration

This document provides example prompts for using Claude with the Issue Cards MCP API. These examples demonstrate how to structure prompts that allow Claude to effectively interact with the Issue Cards system.

> **For AI-Specific Documentation**: We provide specialized [AI documentation](../ai/index.md) with role-specific guidance, workflows, and detailed [Claude integration examples](../ai/tool-examples/claude-integration.md) designed for AI consumption through the onboarding tools.

## Setting Up Claude Integration

Claude can interact with Issue Cards through the MCP API using function calling. This allows Claude to access information about issues, complete tasks, add notes, and more.

### Prerequisites

1. Issue Cards MCP server is running and accessible
2. Claude has been set up with appropriate function definitions for the MCP tools
3. Authentication is configured if required

## Function Definitions for Claude

Here's an example of how to define the MCP functions for Claude:

```json
{
  "mcp__listIssues": {
    "description": "List all issues in the system with optional filtering by state",
    "parameters": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string",
          "enum": ["open", "closed", "all"],
          "description": "Filter issues by state"
        }
      }
    }
  },
  "mcp__showIssue": {
    "description": "Show details of a specific issue",
    "parameters": {
      "type": "object",
      "properties": {
        "issueNumber": {
          "type": "string",
          "description": "The issue number to show (e.g., '0001')"
        }
      },
      "required": ["issueNumber"]
    }
  },
  "mcp__getCurrentTask": {
    "description": "Get the current task with context from the current issue",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  "mcp__addTask": {
    "description": "Add a new task to a specific issue",
    "parameters": {
      "type": "object",
      "properties": {
        "issueNumber": {
          "type": "string",
          "description": "The issue number to add the task to (e.g., '0001')"
        },
        "description": {
          "type": "string",
          "description": "The task description"
        }
      },
      "required": ["issueNumber", "description"]
    }
  },
  "mcp__createIssue": {
    "description": "Create a new issue from a template",
    "parameters": {
      "type": "object",
      "properties": {
        "template": {
          "type": "string",
          "description": "Template name to use (e.g., 'feature', 'bugfix')"
        },
        "title": {
          "type": "string",
          "description": "Issue title"
        },
        "problem": {
          "type": "string",
          "description": "Problem description"
        },
        "approach": {
          "type": "string",
          "description": "Planned approach"
        },
        "task": {
          "oneOf": [
            { "type": "string" },
            { "type": "array", "items": { "type": "string" } }
          ],
          "description": "Task or tasks to add"
        }
      },
      "required": ["template", "title"]
    }
  },
  "mcp__completeTask": {
    "description": "Complete the current task and show the next task",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  "mcp__addNote": {
    "description": "Add a note to a specific section of an issue",
    "parameters": {
      "type": "object",
      "properties": {
        "issueNumber": {
          "type": "string",
          "description": "Issue number (uses current if not specified)"
        },
        "note": {
          "type": "string",
          "description": "The note text to add"
        },
        "section": {
          "type": "string",
          "description": "Section to add the note to (e.g., 'Planned approach', 'Problem to be solved')"
        }
      },
      "required": ["note", "section"]
    }
  },
  "mcp__addQuestion": {
    "description": "Add a question to the Questions to resolve section",
    "parameters": {
      "type": "object",
      "properties": {
        "issueNumber": {
          "type": "string",
          "description": "Issue number (uses current if not specified)"
        },
        "question": {
          "type": "string",
          "description": "The question to add"
        }
      },
      "required": ["question"]
    }
  },
  "mcp__logFailure": {
    "description": "Log a failed approach to the Failed approaches section",
    "parameters": {
      "type": "object",
      "properties": {
        "issueNumber": {
          "type": "string",
          "description": "Issue number (uses current if not specified)"
        },
        "approach": {
          "type": "string",
          "description": "Description of the failed approach"
        },
        "reason": {
          "type": "string",
          "description": "Reason for failure"
        }
      },
      "required": ["approach"]
    }
  }
}
```

## Example Prompts

### Task Analysis and Implementation

```
I'd like you to help me work on an issue in my project using Issue Cards. First, get the current task, analyze it, and help me implement a solution.

1. Start by retrieving the current task and its context
2. Analyze the problem and suggest an implementation approach
3. After we discuss the approach, document it in the issue
4. Help with the implementation
5. When the task is complete, mark it as done and get the next task

Please start by getting the current task.
```

### Creating a New Issue

```
I need to create a new issue to track a bug I found. Here are the details:

- Title: "Fix navigation menu on mobile devices"
- Problem: The navigation menu doesn't collapse properly on mobile screens smaller than 320px wide
- I already tried adjusting the CSS media queries but that didn't solve the issue

Can you help me create this issue using the feature template, and document what I've already tried in the failed approaches section?
```

### Working Through an Existing Issue

```
I need help working through issue #0003. Can you:

1. Show me the details of issue #0003
2. Analyze the current task that needs to be done
3. Help me implement the task
4. Document our approach in the issue
5. Mark the task as complete when we're done

Please start by showing me the issue details.
```

### Enhancing an Issue with Questions and Notes

```
I'm working on the current issue related to authentication. I need help documenting some questions and notes:

1. First, get the current issue to see what we're working on
2. Add the following questions:
   - What should be the token expiration time?
   - Should we use refresh tokens or force re-authentication?
3. Add the following note to the Planned approach section:
   "Use JWT tokens for authentication, stored in HttpOnly cookies for security"

Please help me update the issue with this information.
```

### Documenting a Failed Approach

```
I tried implementing the search functionality using a naive string matching algorithm, but it's too slow for large datasets. Can you help me document this as a failed approach in the current issue? Include the explanation that the worst-case performance is O(n²) which is unacceptable for our dataset size.
```

### Completing a Task and Moving to the Next One

```
I've finished implementing the current task (added the password reset email functionality). Can you help me:

1. Mark the current task as complete
2. Show me what the next task is
3. Give me guidance on how to approach the next task
```

### Getting an Overview of All Issues

```
I need an overview of all the open issues in my project. Can you list them for me and provide a brief summary of each one?
```

## Conversation Flow Example

Here's an example of how a conversation with Claude might flow when working on an issue:

**User**: I need help implementing the current task in my issue tracker. Can you get the current task and help me implement it?

**Claude**: I'll help you implement the current task. Let me first retrieve it to understand what we're working on.

*[Claude calls mcp__getCurrentTask]*

**Claude**: I've retrieved the current task. You're working on:

Task: "Implement password hashing and verification"

Context:
- Problem: Users need to be able to securely log into the application.
- Approach: Use JWT tokens with secure cookie storage and implement proper password hashing.
- Failed approaches: Tried using localStorage for token storage but found security vulnerabilities.

Let me suggest an approach for implementing password hashing:

1. We should use the bcrypt library for password hashing, as it's specifically designed for passwords
2. A work factor of 10-12 is recommended for a good balance of security and performance
3. We'll need to implement both hashing (for registration) and verification (for login)

Does this approach sound good to you?

**User**: Yes, that sounds perfect. Let's document this approach in the issue.

**Claude**: I'll add this approach to the issue.

*[Claude calls mcp__addNote with section="Planned approach" and note="Implement password hashing using bcrypt with a work factor of 12. This provides strong security while maintaining acceptable performance. We'll implement both the hash function (for registration) and verify function (for login).]*

**Claude**: I've documented our approach in the issue. Now let's start implementing.

First, we'll need to install bcrypt:

```bash
npm install bcrypt
```

Then, let's create the password utilities:

```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  verifyPassword
};
```

Does this implementation look good to you?

**User**: That looks great! I've implemented it. Let's mark this task as complete.

**Claude**: I'll mark the task as complete and show you the next task.

*[Claude calls mcp__completeTask]*

**Claude**: The task "Implement password hashing and verification" has been completed!

Your next task is: "Create login endpoint +e2e-test"

This task appears to have the e2e-test tag, which means it will include steps for end-to-end testing. Would you like me to help you implement this new task?

## Tips for Effective Claude Integration

1. **Start with Context**: Always begin by getting the current task or issue details to understand the context.

2. **Document Everything**: Use the note-taking tools to document Claude's reasoning and approaches.

3. **Log Failed Attempts**: If a suggested approach doesn't work, log it as a failed approach to maintain a record.

4. **Use Questions**: When Claude has uncertainties, add them as questions in the issue for future reference.

5. **Complete Tasks Methodically**: Work through tasks sequentially and mark them complete when finished.

6. **Provide Clear Instructions**: When asking Claude to help, be specific about what you want it to do.

7. **Review Before Implementing**: Always review Claude's suggestions before implementing them or marking tasks complete.

By following these practices, you can effectively use Claude to assist with issue tracking and task implementation.