# Issue 0007: Fix Fix issue not closing when all tasks are complete

## Problem to be solved
When all tasks in an issue are completed, the system displays a message that the issue is closed, but it remains in the open issues directory

## Planned approach
Add code to move the issue file from the open directory to the closed directory when all tasks are complete

## Failed approaches


## Questions to resolve


## Tasks
- [x] Write failing unit tests for the functionality
- [x] Run the unit tests and verify they fail for the expected reason
- [x] Write unit test for closeIssue function
- [x] Run unit tests and verify they now pass
- [x] Make sure test coverage meets project requirements
- [x] Implement closeIssue function in issueManager.js
- [x] Update completeTaskAction to call closeIssue when all tasks are complete
- [x] Add git handling for issue closure
- [x] Update tests for completeTask command
- [x] Write failing end-to-end test that verifies the expected behavior
- [x] Run the test and verify it fails correctly
- [x] {{TASK}}
- [x] Run the end-to-end test and verify it passes
- [x] Verify the feature works in the full application context
- [x] Write E2E test for issue closure

## Instructions


## Next steps

