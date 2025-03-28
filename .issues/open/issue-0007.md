# Issue 0007: Fix Fix issue not closing when all tasks are complete

## Problem to be solved
When all tasks in an issue are completed, the system displays a message that the issue is closed, but it remains in the open issues directory

## Planned approach
Add code to move the issue file from the open directory to the closed directory when all tasks are complete

## Failed approaches


## Questions to resolve


## Tasks
- [ ] Write failing unit tests for the functionality
- [ ] Run the unit tests and verify they fail for the expected reason
- [ ] Write unit test for closeIssue function
- [ ] Run unit tests and verify they now pass
- [ ] Make sure test coverage meets project requirements
- [ ] Implement closeIssue function in issueManager.js
- [ ] Update completeTaskAction to call closeIssue when all tasks are complete
- [ ] Add git handling for issue closure
- [ ] Update tests for completeTask command
- [ ] Write failing end-to-end test that verifies the expected behavior
- [ ] Run the test and verify it fails correctly
- [ ] {{TASK}}
- [ ] Run the end-to-end test and verify it passes
- [ ] Verify the feature works in the full application context
- [ ] Write E2E test for issue closure

## Instructions


## Next steps

