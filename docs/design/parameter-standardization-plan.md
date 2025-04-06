# Parameter Standardization Plan

This document outlines the standardization plan for parameter naming across the Issue Cards application, particularly focusing on the MCP API tools and response fields.

## Current State

The codebase currently has several inconsistencies in parameter naming:

1. **Issue Reference Inconsistencies:**
   - In MCP tool parameters: `issueNumber` is used consistently
   - In response objects: Sometimes `number` (mcp__createIssue), sometimes `issueNumber` (mcp__completeTask)
   - In addTaskToIssue response: `issueNumber` field in the response when internally the field is called `number`

2. **Content Parameter Naming Inconsistencies:**
   - `mcp__addQuestion` uses `question` parameter
   - `mcp__addTask` uses `description` parameter 
   - `mcp__addNote` uses `note` parameter
   - `mcp__logFailure` uses `approach` parameter

## Standardization Goals

1. Establish consistent field names for issue references in both parameters and response objects
2. Standardize content parameter naming across similar commands
3. Ensure naming and terminology align with the established guidelines in docs/naming-and-terminology.md

## Detailed Implementation Plan

### 1. Standardize Issue Reference Field Names

- **Standard**: Use `issueNumber` consistently across all parameter definitions and response objects
- **Files to modify**:
  - `src/mcp/tools.js`: Standardize response objects to use `issueNumber` instead of `number`
  - Specific changes needed:
    - Line 238: Change `number: issueNumber` to `issueNumber: issueNumber` in mcp__createIssue response

### 2. Standardize Content Parameter Fields 

- **Standard**: Use content-specific parameter names that clearly indicate the purpose
  - Keep `question` for mcp__addQuestion
  - Keep `description` for mcp__addTask
  - Keep `note` for mcp__addNote
  - Keep `approach` for mcp__logFailure
- **Reasoning**: Each parameter name reflects the specific type of content being added, which is more intuitive than a generic name like "content"

### 3. Documentation Updates

- **Standard**: Update documentation to reflect standardized parameter and field names
- **Files to modify**:
  - `docs/mcp-tool-reference.md`: Ensure all response examples use `issueNumber` consistently
  - `docs/mcp-curl-examples.md`: Update curl examples to use standard field names

### 4. Testing Plan

1. Update unit tests to validate response field names are correct
2. Create or update e2e tests that specifically verify field naming in responses
3. Ensure all existing functionality works with the standardized parameter names

## Future Considerations

1. Consider further standardizing parameter descriptions across similar commands
2. Evaluate whether parameter defaults should be more consistent
3. Consider standardizing CLI commands to match MCP parameter naming more closely

## Timeline and Priority

1. First priority: Standardize issue reference field in responses (most impactful for API consumers)
2. Second priority: Update documentation to reflect standardized naming
3. Third priority: Add tests to validate response field names

## Affected Files Summary

- `src/mcp/tools.js` - Line 238
- `docs/mcp-tool-reference.md` - Example responses
- `docs/mcp-curl-examples.md` - Example requests and responses