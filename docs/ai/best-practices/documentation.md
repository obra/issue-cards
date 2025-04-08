// ABOUTME: AI-specific best practices for documentation in issue-cards
// ABOUTME: Contains guidance for effective documentation of issues, tasks, and approaches

# Documentation Best Practices

## Issue Documentation Principles

### Problem Statements
- **User-focused**: Describe problems from the user or business perspective
- **Specific and concrete**: Avoid vague or general problem statements
- **Include context**: Provide background information needed to understand the issue
- **State importance**: Explain why this problem matters
- **Define scope**: Clearly indicate what is and isn't part of the problem

### Approach Documentation
- **Be specific about methods**: Describe the specific approach, not just general direction
- **Include technical details**: Note libraries, patterns, or technologies to be used
- **Explain rationale**: Document why this approach was chosen over alternatives
- **Address constraints**: Note any limitations or constraints that influenced the approach
- **Link to resources**: Reference relevant documentation, examples, or standards

### Task Documentation
- **Clear and actionable**: Tasks should clearly state what needs to be done
- **Include context**: Provide enough background to understand the purpose
- **Define success criteria**: State how to verify the task is complete
- **Use appropriate tags**: Add tags for testing, documentation, or other requirements

## Using Documentation Tools

### Adding Notes to Sections
```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "We'll use JWT tokens stored in HttpOnly cookies with a short expiration time (15 minutes) and implement refresh tokens with a longer expiration (7 days). This provides a balance between security and user experience, as tokens are automatically refreshed during active use but require re-authentication after periods of inactivity."
  }
}
```

### Documenting Questions
```json
{
  "tool": "mcp__addQuestion",
  "args": {
    "question": "Should we implement multi-factor authentication in the initial release or plan it for a future iteration?"
  }
}
```

### Logging Failed Approaches
```json
{
  "tool": "mcp__logFailure",
  "args": {
    "approach": "Tried implementing authentication using localStorage for token storage",
    "reason": "This approach is vulnerable to XSS attacks since JavaScript can access localStorage. Using HttpOnly cookies provides better security as they cannot be accessed via JavaScript."
  }
}
```

## Documentation Patterns for Different Sections

### Problem to be Solved
- Start with a clear statement of what needs to be accomplished
- Include user stories or scenarios when relevant
- Describe current pain points or limitations
- Provide context about why this is important now
- Define metrics for success if applicable

### Planned Approach
- Outline the overall strategy
- Include specific technical choices and rationale
- Address potential challenges and how they'll be handled
- Note dependencies or prerequisites
- Include diagrams or links to reference materials when helpful

### Failed Approaches
- Describe exactly what was attempted
- Explain why it didn't work (technical limitations, performance issues, etc.)
- Include any error messages, behavior observations, or metrics
- Note what was learned from the failure
- Suggest alternative approaches if applicable

### Questions to Resolve
- Frame questions precisely to get useful answers
- Include context about why the question matters
- If appropriate, suggest possible answers to consider
- Link questions to specific tasks or sections when relevant
- Update questions with answers when resolved

## Additional Documentation Tips

### Technical Detail Level
- **Include implementation specifics**: Document specific libraries, versions, and configuration details
- **Add code examples**: When appropriate, include short code snippets to illustrate approaches
- **Reference patterns**: Note design patterns or architectural concepts being applied
- **Document algorithms**: Explain complex algorithms or data processing workflows
- **Note performance considerations**: Document performance expectations or optimizations

### Cross-Referencing
- **Link related issues**: Reference related or dependent issues by number
- **Reference external resources**: Include links to documentation, standards, or examples
- **Connect to project goals**: Tie issues to higher-level project objectives
- **Note dependencies**: Document dependencies on other systems or components