# Integration with AI Tools

Issue Cards is specifically designed to work seamlessly with AI coding assistants like GitHub Copilot, Claude, ChatGPT, and other large language models. This document explains how to effectively use Issue Cards with AI tools.

## Table of Contents

- [Why Issue Cards Works Well with AI](#why-issue-cards-works-well-with-ai)
- [Best Practices for AI Collaboration](#best-practices-for-ai-collaboration)
- [Sample Prompts](#sample-prompts)
- [Common Workflows](#common-workflows)
- [Output Formatting for AI Consumption](#output-formatting-for-ai-consumption)
- [Advanced AI Integration](#advanced-ai-integration)

## Why Issue Cards Works Well with AI

Issue Cards has several features that make it particularly effective for AI collaboration:

1. **Consistent Output Format**: All commands produce output in a predictable text-based format that's easy for AI tools to parse and understand.

2. **Complete Context**: The `current` command provides comprehensive context that gives AI tools all the information they need to understand the task, including:
   - Problem description
   - Previous failed approaches
   - Implementation instructions
   - Expanded task steps
   - Upcoming tasks

3. **Linear Task Sequencing**: Tasks are presented in a clear, sequential order so AI knows exactly what needs to be done next.

4. **Tag-Based Task Expansion**: Tags like `#unit-test` automatically expand tasks into detailed steps, providing helpful guidance that makes it easier for AI to follow software engineering best practices.

5. **Markdown-Based Storage**: All issues are stored as simple markdown files, a format that all modern AI tools understand extremely well.

6. **Failure Tracking**: The ability to log failed approaches prevents AI tools from repeating solutions that have already been tried and didn't work.

## Best Practices for AI Collaboration

### Setting Up Issues for AI

When creating issues that will be implemented with AI help:

1. **Be Specific in Problem Descriptions**: Provide clear, detailed descriptions of the problem to solve.
   ```bash
   issue-cards create feature --title "Add search functionality" \
     --problem "Users need to search for products by name, description, or category. 
     Search should handle partial matches and typos. Results should be paginated and 
     sorted by relevance. The search feature should be accessible from any page."
   ```

2. **Include Failed Approaches**: Document solutions that have already been tried.
   ```bash
   issue-cards log-failure "Tried using the built-in indexOf string search but it was too slow for our dataset size and didn't handle typos."
   ```

3. **Add Specific Instructions**: Provide clear guidelines on implementation requirements.
   ```bash
   issue-cards create feature --title "..." \
     --instructions "The implementation must use async/await, follow our API error handling pattern, and include comprehensive unit tests. Ensure compatibility with IE11."
   ```

4. **Use Tags for Process Guidance**: Add appropriate tags to tasks to guide the AI through the process.
   ```bash
   issue-cards add-task "Implement search index builder" --tags "unit-test,performance-test"
   ```

### Working with AI on Tasks

1. **Share the Current Task**: Always start by showing the AI the current task context.
   ```bash
   issue-cards current
   # Copy the output to your AI assistant
   ```

2. **Log Failed Attempts**: When the AI suggests an approach that doesn't work, log it for future reference.
   ```bash
   issue-cards log-failure "AI suggested using a regular expression for matching, but it couldn't handle the fuzzy matching requirements."
   ```

3. **Add Questions for Clarification**: When the AI needs more information, record questions.
   ```bash
   issue-cards add-question "What's the maximum number of search results we should return per page?"
   ```

4. **Complete and Move Forward**: After the AI successfully implements a task, mark it complete and share the next task.
   ```bash
   issue-cards complete-task
   # Copy the output to your AI assistant to continue working
   ```

## Sample Prompts

Here are effective prompts to use with AI tools in conjunction with Issue Cards:

### Initial Task Implementation

```
I'm working on a task in my project using Issue Cards for tracking. Here's the current task:

[Paste output of `issue-cards current` here]

Please help me implement this functionality according to the requirements. Take note of any failed approaches that have been mentioned to avoid repeating them.
```

### Continuing Work After a Task

```
Great work on implementing that task. I've marked it as complete. Here's the next task to work on:

[Paste output of `issue-cards complete-task` here]

Let's continue with this task following the same approach.
```

### Getting Help with a Problem

```
I'm working on this task:

[Paste output of `issue-cards current` here]

I'm stuck on step 3 because [explain specific issue]. I've tried [describe approach], but it's not working because [explain problem]. Can you suggest an alternative approach?
```

### Adding a New Task or Note

```
Based on our implementation, I think we need an additional task. I'm going to add it with:

issue-cards add-task "Implement caching for search results" --tags "performance-test"

This will help with the performance issues we're seeing. Let's continue with the current task for now, and we'll address this new task later.
```

## Common Workflows

### Bug Fixing with AI

```bash
# Create a bug issue
issue-cards create bugfix --title "Fix login failure on mobile devices"

# Describe the problem in detail
issue-cards add-note "When users try to log in on iOS Safari, the login request is sent but the response is not handled correctly."

# Show the current task to the AI
issue-cards current
# [Share with AI]

# After AI analysis, add a more specific task
issue-cards add-task "Fix CORS handling in Safari" --tags "unit-test"

# Log failed approaches as AI suggests them
issue-cards log-failure "Setting Access-Control-Allow-Origin to * didn't fix the issue"

# Continue collaboration until the bug is fixed
issue-cards complete-task
```

### Feature Implementation with AI

```bash
# Create a detailed feature issue
issue-cards create feature --title "Implement user notifications" \
  --problem "Users need to receive notifications for important events like order status changes." \
  --approach "We'll implement both in-app and email notifications with user preferences."

# Break down into tasks with appropriate tags
issue-cards add-task "Create notification data model" --tags "unit-test"
issue-cards add-task "Implement notification service" --tags "unit-test"
issue-cards add-task "Create notification UI components" --tags "unit-test,update-docs"
issue-cards add-task "Implement email delivery service" --tags "e2e-test"

# Start working with AI
issue-cards current
# [Share with AI]

# Continue collaboration through all tasks
issue-cards complete-task
# [Share with AI]
# ...

# When AI suggests improvements
issue-cards add-task "Add notification grouping for better UX" --tags "unit-test"
```

## Output Formatting for AI Consumption

Issue Cards produces output in a consistent format that's designed to be easily parsed by AI tools:

```
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
```

This format provides clear sections that AI tools can identify:
- The main task being worked on
- Context about the problem
- Failed approaches to avoid
- Implementation instructions
- Specific steps to follow
- Future tasks for context

## Advanced AI Integration

### Using with Language Model APIs

You can integrate Issue Cards directly with AI APIs:

```javascript
// Example using OpenAI API
const { exec } = require('child_process');
const { Configuration, OpenAIApi } = require('openai');

// Get current task context
const getCurrentTask = () => {
  return new Promise((resolve, reject) => {
    exec('issue-cards current', (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

// Ask AI for implementation help
const getAIImplementation = async (taskContext) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  
  const prompt = `
I'm working on a programming task in my project. Here's the current task:

${taskContext}

Please provide an implementation that follows the instructions and addresses the task steps.
`;

  const response = await openai.createCompletion({
    model: "gpt-4",
    prompt,
    max_tokens: 2000,
  });
  
  return response.data.choices[0].text;
};

// Main function to get AI help
async function getHelpWithCurrentTask() {
  try {
    const taskContext = await getCurrentTask();
    const implementation = await getAIImplementation(taskContext);
    console.log("AI SUGGESTED IMPLEMENTATION:");
    console.log(implementation);
  } catch (error) {
    console.error("Error:", error);
  }
}

getHelpWithCurrentTask();
```

### Automated PR and Commit Messages

You can use Issue Cards' structured information to generate commit and PR messages via AI:

```javascript
const { exec } = require('child_process');

// Generate commit message for the current task
const generateCommitMessage = async () => {
  // Get the current task info
  const currentTask = await new Promise((resolve) => {
    exec('issue-cards current', (error, stdout) => {
      resolve(stdout);
    });
  });
  
  // Extract the issue number and task name
  const issueMatch = currentTask.match(/Issue (\d+)/);
  const taskMatch = currentTask.match(/TASK: (.+?)(\n|$)/);
  
  if (issueMatch && taskMatch) {
    const issueNumber = issueMatch[1];
    const taskName = taskMatch[1].trim();
    
    // Format commit message
    return `Implement ${taskName}\n\nCloses #${issueNumber}`;
  }
  
  return "Update implementation";
};

// Usage
const commit = async () => {
  const message = await generateCommitMessage();
  exec(`git commit -m "${message}"`, (error, stdout) => {
    console.log(stdout);
  });
};

commit();
```