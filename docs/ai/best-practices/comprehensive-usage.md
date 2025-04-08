// ABOUTME: AI-specific best practices for comprehensive issue-cards usage
// ABOUTME: Contains advanced guidance and strategies for effective issue management

# Comprehensive Issue-Cards Usage

## Issue Structure and Documentation

### Clear Problem Statements
- **Focus on user impact**: Describe how the issue affects users or system functionality
- **Include detailed context**: Provide background information necessary to understand the issue
- **Be specific and concrete**: Avoid vague descriptions like "it doesn't work properly"
- **Include reproduction steps**: For bugs, list exact steps to reproduce the issue
- **Indicate severity**: Note how critical the issue is to system operation

### Effective Approach Documentation
- **Document the strategy**: Explain the high-level approach before implementation
- **Consider alternatives**: Note why this approach was chosen over alternatives
- **List technical considerations**: Include performance, security, and other factors
- **Reference patterns or standards**: Link to relevant patterns being followed
- **Note constraints**: Document any limitations affecting the implementation

### Context Management
- **Record important decisions**: Document significant decisions that affect implementation
- **Track external dependencies**: Note any dependencies on other systems or teams
- **Document environmental factors**: Include relevant configuration or environment details
- **Maintain cross-references**: Link related issues or external resources
- **Capture stakeholder requirements**: Document client or stakeholder-specific needs

## Advanced Workflow Techniques

### Progressive Refinement
- Start with high-level tasks and break them down as work progresses
- Refine task descriptions as understanding improves
- Add discovered tasks that weren't initially apparent
- Update approach documentation as implementation details are clarified

### Collaborative Workflows
- Use questions to highlight aspects needing input from others
- Add notes to document decisions made by the team
- Clearly assign ownership for specific tasks when applicable
- Document discussions and their outcomes in the issue

### Handling Complex Issues
- Break complex issues into multiple related issues if necessary
- Create clear dependencies between related issues
- Use consistent naming conventions for related issues
- Consider creating a "parent" issue to track overall progress

## Example Tool Usage

### Comprehensive Issue Creation
```json
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement multi-factor authentication system",
    "problem": "Users need additional security options beyond password authentication to protect sensitive data and operations. Current single-factor authentication is insufficient for high-security operations like financial transactions or admin functions.",
    "approach": "Implement a tiered authentication system with options for SMS, app-based TOTP, and security keys. We'll use a modular design where authentication methods can be plugged in, and operations can require specific authentication levels.",
    "task": [
      "Research industry best practices for MFA implementation",
      "Design authentication factor registration workflow #unit-test",
      "Implement SMS verification service integration #unit-test",
      "Create TOTP implementation with QR code generation #unit-test",
      "Add security key (WebAuthn) support #e2e-test",
      "Design and implement UI for factor management",
      "Create authorization policy system for requiring specific factors #unit-test",
      "Update login flow to incorporate MFA challenge #e2e-test",
      "Implement account recovery mechanisms #e2e-test",
      "Update security documentation #update-docs"
    ],
    "questions": [
      "What is our SMS provider's rate limiting policy?",
      "Should users be required to register a backup authentication method?",
      "How should we handle MFA during password reset?"
    ]
  }
}
```

### Documenting Implementation Strategy
```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "After research, we'll implement TOTP using the otplib library with SHA-256 hashing. We'll store TOTP secrets encrypted in the database using our existing encryption service. The implementation will follow RFC 6238 standards with a 30-second time step and 6-digit codes."
  }
}
```

### Recording Design Decisions
```json
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Notes",
    "note": "Decision: We will use a progressive MFA implementation that allows users to login with password first and then prompts for additional factors only when needed, rather than requiring all factors for initial login. This improves user experience while maintaining security for sensitive operations."
  }
}
```

## Issue Progress and Completion

### Iterative Development
- Complete tasks incrementally to show visible progress
- Update tasks with more specific details as work proceeds
- Add notes explaining how implementations differ from initial plan
- Document lessons learned during implementation

### Quality Verification
- Include specific verification steps in tasks
- Create dedicated testing tasks with clear criteria
- Document edge cases discovered during implementation
- Track test coverage and performance considerations

### Closure and Documentation
- Ensure all tasks are completed before closing issues
- Document final implementation details
- Add notes about maintenance and operational considerations
- Include references to related documentation or knowledge base articles