// ABOUTME: AI-specific examples of advanced MCP tool usage
// ABOUTME: Contains practical examples for complex operations and workflows

# Advanced MCP Tool Usage Examples

## Complex Workflow Examples

### Complete Feature Development Cycle
This example shows a complete workflow for creating and implementing a feature:

```json
// Step 1: Create the feature issue
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement multi-factor authentication",
    "problem": "Users need additional security beyond password-based authentication",
    "approach": "Add TOTP (Time-based One-Time Password) as a second factor using the RFC 6238 standard",
    "task": [
      "Research TOTP libraries compatible with our stack",
      "Design database schema additions for MFA #unit-test",
      "Implement TOTP secret generation and storage #unit-test",
      "Create QR code generation for app setup #unit-test",
      "Add verification endpoint for TOTP codes #unit-test",
      "Implement recovery codes mechanism #unit-test",
      "Create MFA setup UI flow #e2e-test",
      "Add authentication flow modifications for MFA #e2e-test",
      "Create user documentation for MFA setup #update-docs"
    ]
  }
}

// Step 2: Get the current task
{
  "tool": "mcp__getCurrentTask",
  "args": {}
}

// Step 3: Add research findings
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "After evaluating options, we'll use the 'otplib' package which is well-maintained, has good test coverage, and supports all the features we need"
  }
}

// Step 4: Complete the first task
{
  "tool": "mcp__completeTask",
  "args": {}
}

// Step 5: Document database design decisions
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "Database schema will add the following fields to the User model:\n- totpSecret (encrypted string)\n- mfaEnabled (boolean)\n- recoveryCodes (encrypted JSON array)\n- lastUsedRecoveryCodeAt (timestamp)"
  }
}

// Step 6: Complete the second task
{
  "tool": "mcp__completeTask",
  "args": {}
}

// Step 7: Log a failed approach
{
  "tool": "mcp__logFailure",
  "args": {
    "approach": "Tried storing TOTP secrets as plain text in the database",
    "reason": "Security audit flagged this as a vulnerability. Secrets must be encrypted at rest."
  }
}

// Step 8: Add implementation details
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "TOTP implementation details:\n- 6-digit codes\n- 30-second window\n- SHA-256 algorithm\n- Allow 1 time step skew for clock drift"
  }
}

// Step 9: Add a question about requirements
{
  "tool": "mcp__addQuestion",
  "args": {
    "question": "Should MFA be required for all users or optional?"
  }
}

// Step 10: Continue completing tasks
{
  "tool": "mcp__completeTask",
  "args": {}
}
```

### Bug Diagnosis and Fix Workflow
This example shows a workflow for diagnosing and fixing a complex bug:

```json
// Step 1: Create the bugfix issue
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "bugfix",
    "title": "Fix data loading race condition in dashboard",
    "problem": "Dashboard occasionally shows stale or missing data when navigating between views. Steps to reproduce:\n1. Load the dashboard\n2. Quickly navigate to another view and back\n3. Observe that some data widgets show 'Loading...' indefinitely or display outdated information",
    "task": [
      "Reproduce the issue consistently",
      "Add instrumentation to track component lifecycles and data fetching",
      "Identify the specific race condition",
      "Design a fix that prevents the race condition",
      "Implement the fix #unit-test",
      "Verify fix works in all edge cases #e2e-test"
    ]
  }
}

// Step 2: Document reproduction steps in detail
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Problem to be solved",
    "note": "Reproduction details:\n- Issue occurs ~40% of the time when navigation happens during data loading\n- Most frequent with the User Activity widget\n- More common on slower network connections\n- Console shows cancelled network requests"
  }
}

// Step 3: Complete the first task
{
  "tool": "mcp__completeTask",
  "args": {}
}

// Step 4: Document investigation findings
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "Instrumentation findings:\n- Component unmounts during data fetch\n- New component instance mounts but doesn't trigger a new fetch\n- Stale fetch completes but data isn't applied to new component instance\n- No cancellation token being used for in-flight requests"
  }
}

// Step 5: Complete the investigation tasks
{
  "tool": "mcp__completeTask",
  "args": {}
}
{
  "tool": "mcp__completeTask",
  "args": {}
}

// Step 6: Document the planned fix
{
  "tool": "mcp__addNote",
  "args": {
    "section": "Planned approach",
    "note": "Proposed fix:\n1. Use AbortController to cancel in-flight requests on unmount\n2. Implement a request deduplication mechanism with cache keys\n3. Add a component state flag to prevent duplicate fetches\n4. Create a custom hook to manage request lifecycle"
  }
}

// Step 7: Log a failed approach
{
  "tool": "mcp__logFailure",
  "args": {
    "approach": "Tried using simple boolean flag to prevent duplicate requests",
    "reason": "This solved the immediate issue but caused new problems with the cache not refreshing when needed"
  }
}

// Step 8: Complete implementation and testing
{
  "tool": "mcp__completeTask",
  "args": {}
}
{
  "tool": "mcp__completeTask",
  "args": {}
}
{
  "tool": "mcp__completeTask",
  "args": {}
}
```

## Advanced Tool Combinations

### Extending an Existing Issue with New Requirements

```json
// Step 1: View the existing issue
{
  "tool": "mcp__showIssue",
  "args": { "issueNumber": "0001" }
}

// Step 2: Add a note about new requirements
{
  "tool": "mcp__addNote",
  "args": {
    "issueNumber": "0001",
    "section": "Problem to be solved",
    "note": "Additional requirement: Solution must also work offline and sync when connectivity is restored"
  }
}

// Step 3: Add new tasks for the additional requirements
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Implement offline data storage mechanism #unit-test",
    "after": true
  }
}
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Create data synchronization system #unit-test",
    "after": true
  }
}
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Add connectivity detection and status indicators",
    "after": true
  }
}
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0001",
    "description": "Test offline behavior and sync conflicts #e2e-test",
    "after": true
  }
}

// Step 4: Update the approach with new architectural considerations
{
  "tool": "mcp__addNote",
  "args": {
    "issueNumber": "0001",
    "section": "Planned approach",
    "note": "Offline support architecture:\n- Use IndexedDB for local storage\n- Implement optimistic UI updates\n- Add conflict resolution strategy for simultaneous edits\n- Include sync queue for pending changes\n- Add background sync using Service Workers"
  }
}
```

### Issue Review and Feedback

```json
// Step 1: Examine the issue to review
{
  "tool": "mcp__showIssue",
  "args": { "issueNumber": "0003" }
}

// Step 2: Add structured feedback
{
  "tool": "mcp__addNote",
  "args": {
    "issueNumber": "0003",
    "section": "Planned approach",
    "note": "Review feedback:\n1. The selected approach works but has performance implications for large datasets\n2. Consider adding pagination to the API endpoints\n3. The proposed caching mechanism might cause issues with cache invalidation\n4. Security review needed for the file upload component"
  }
}

// Step 3: Add specific questions that need to be addressed
{
  "tool": "mcp__addQuestion",
  "args": {
    "issueNumber": "0003",
    "question": "Have we done performance testing with datasets exceeding 10,000 records?"
  }
}
{
  "tool": "mcp__addQuestion",
  "args": {
    "issueNumber": "0003", 
    "question": "What is our strategy for cache invalidation when data is updated through another channel?"
  }
}

// Step 4: Add required follow-up tasks
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0003",
    "description": "Add pagination to API endpoints #performance",
    "after": true
  }
}
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0003",
    "description": "Conduct security review of file upload component #security",
    "after": true
  }
}
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0003",
    "description": "Implement cache invalidation strategy #reliability",
    "after": true
  }
}
```

### Template Management and Application

```json
// Step 1: List available templates
{
  "tool": "mcp__listTemplates",
  "args": { "type": "issue" }
}

// Step 2: Examine a specific template
{
  "tool": "mcp__showTemplate",
  "args": {
    "name": "feature",
    "type": "issue"
  }
}

// Step 3: Create an issue with the template
{
  "tool": "mcp__createIssue",
  "args": {
    "template": "feature",
    "title": "Implement data export functionality",
    "problem": "Users need to be able to export their data in common formats for analysis and backup",
    "approach": "Create a flexible export system supporting CSV, JSON, and Excel formats",
    "task": [
      "Design the export API architecture #unit-test",
      "Implement data query and filtering system #unit-test",
      "Create CSV export formatter #unit-test",
      "Create JSON export formatter #unit-test",
      "Create Excel export formatter #unit-test",
      "Add background processing for large exports #unit-test",
      "Implement export history and management UI #e2e-test",
      "Create export file download system #e2e-test",
      "Add user documentation for export features #update-docs"
    ],
    "instructions": "The export system should be designed with extensibility in mind to support additional export formats in the future"
  }
}

// Step 4: List tag templates
{
  "tool": "mcp__listTemplates",
  "args": { "type": "tag" }
}

// Step 5: Examine tag template
{
  "tool": "mcp__showTemplate",
  "args": {
    "name": "e2e-test",
    "type": "tag"
  }
}

// Step 6: Apply tag template by adding a task with the tag
{
  "tool": "mcp__addTask",
  "args": {
    "issueNumber": "0004",
    "description": "Test export system with very large datasets #e2e-test",
    "after": true
  }
}
```