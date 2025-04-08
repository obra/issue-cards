// ABOUTME: AI-specific workflow documentation for technical audits
// ABOUTME: Contains step-by-step instructions and tool examples

# Technical Audit Workflow

## Overview
This workflow guides you through conducting a systematic technical audit of a system or feature, documenting findings, and creating follow-up tasks.

## Steps
1. Create an audit issue using `mcp__createIssue` with the audit template
2. Define the scope and objectives in the problem statement
3. Create comprehensive audit tasks covering all areas to be examined
4. Work through audit tasks systematically
5. Document findings using `mcp__addNote` in relevant sections
6. Ask questions about unclear aspects using `mcp__addQuestion`
7. Log approaches that don't work with `mcp__logFailure`
8. Create follow-up tasks for improvements with `mcp__addTask`

## Example Tool Sequence
```json
[
  { 
    "tool": "mcp__createIssue",
    "args": {
      "template": "audit",
      "title": "Security audit of API endpoints",
      "problem": "Need to ensure all API endpoints properly validate permissions and handle edge cases securely",
      "approach": "Systematically review each endpoint and its authentication/authorization mechanisms",
      "task": [
        "Create inventory of all API endpoints",
        "Document required permissions for each endpoint",
        "Audit authentication checks in each endpoint",
        "Audit authorization checks in each endpoint",
        "Identify and fix missing permission checks #unit-test",
        "Create penetration test plan #e2e-test",
        "Document findings and improvements"
      ]
    }
  },
  {
    "tool": "mcp__getCurrentTask",
    "args": {}
  },
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Planned approach",
      "note": "Using a spreadsheet to track all endpoints with columns for endpoint path, method, required permissions, auth check status, and notes"
    }
  },
  {
    "tool": "mcp__addNote",
    "args": {
      "section": "Problem to be solved",
      "note": "Found 3 endpoints missing proper authorization checks: /api/users/profile, /api/reports/generate, and /api/settings/read"
    }
  },
  {
    "tool": "mcp__addTask",
    "args": {
      "description": "Add missing authorization check to /api/users/profile endpoint #security",
      "after": true
    }
  }
]
```

## Tips
- Define clear audit criteria before starting the process
- Create a systematic checklist to ensure comprehensive coverage
- Document both positive findings and areas for improvement
- Use specific technical details in your notes
- Create separate tasks for each distinct issue discovered
- Consider multiple security aspects: authentication, authorization, input validation, etc.
- Document patterns of issues rather than just individual instances
- Tag security-related tasks appropriately
- Include recommendations with specific actions to take
- Reference industry best practices or standards when applicable