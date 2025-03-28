# Issue 0003: Implement MCP Tool Output Capturing

## Problem to be solved
We need a way to capture command output that normally goes to the console for use in MCP tools

## Planned approach
Create a utility to intercept output manager calls and return structured data


We'll enhance the output manager to always capture output, rather than having a separate capture flag. We'll add a suppressConsole option to control console display, and command context tracking to separate output by command. This simplifies the mental model: output is always captured and we just decide whether to display it. This approach is detailed in docs/design-decisions/mcp-output-capture.md and failing tests have been written to validate the new functionality.
## Failed approaches


## Questions to resolve


## Tasks
- [x] Write failing unit tests for the functionality
- [x] Run the unit tests and verify they fail for the expected reason
- [x] Implement output capturing functionality
- [x] Run the end-to-end test and verify it passes
- [x] Verify the feature works in the full application context
- [x] Write integration tests for output capturing with real commands

## Instructions
Ensure all output manager methods are properly intercepted. Maintain proper error handling throughout.

## Next steps

