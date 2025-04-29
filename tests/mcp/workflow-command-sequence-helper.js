// ABOUTME: Helper for testing MCP workflow command sequences
// ABOUTME: Provides utility functions for testing different workflow scenarios

const {
  mcp__createIssue,
  mcp__getCurrentTask,
  mcp__addNote,
  mcp__addQuestion,
  mcp__logFailure,
  mcp__completeTask
} = require('../../src/mcp/tools');

/**
 * Setup mock functions for testing workflow sequences
 * @returns {Object} Object containing mock functions
 */
function setupMocksForTDDWorkflow() {
  // Import the required modules
  const issueManager = require('../../src/utils/issueManager');
  const taskParser = require('../../src/utils/taskParser');
  const sectionManager = require('../../src/utils/sectionManager');
  const template = require('../../src/utils/template');
  
  // Setup mock behavior for issue manager
  issueManager.getNextIssueNumber = jest.fn().mockResolvedValue('0001');
  issueManager.saveIssue = jest.fn().mockResolvedValue(true);
  issueManager.getCurrentIssue = jest.fn().mockResolvedValue({
    issueNumber: '0001',
    title: 'Test Issue',
    content: '# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2 +unit-test'
  });
  issueManager.getCurrentTask = jest.fn().mockResolvedValue({
    id: 'task-2',
    description: 'Task 2 +unit-test',
    index: 1
  });
  issueManager.getIssue = jest.fn().mockResolvedValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2 +unit-test\n\n## Planned approach\n\n## Test implementation\n\n## Implementation notes\n\n## Refactoring\n\n## Failed approaches\n\n## Questions to resolve');
  issueManager.closeIssue = jest.fn().mockResolvedValue(true);
  
  // Setup mock behavior for task parser
  taskParser.extractTasks = jest.fn().mockReturnValue([
    { id: 'task-1', text: 'Task 1', completed: false, index: 0 },
    { id: 'task-2', text: 'Task 2 +unit-test', completed: false, index: 1 }
  ]);
  taskParser.findCurrentTask = jest.fn().mockReturnValue(
    { id: 'task-2', text: 'Task 2 +unit-test', completed: false, index: 1 }
  );
  taskParser.updateTaskStatus = jest.fn().mockReturnValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [x] Task 1\n- [ ] Task 2 +unit-test');
  
  // Setup mock behavior for section manager
  sectionManager.addContentToSection = jest.fn().mockImplementation((content, sectionName, newContent, format, options) => {
    // Mock implementation that adds content to the section
    return content + `\n\n## ${sectionName}\n${newContent}`;
  });
  sectionManager.findSectionByName = jest.fn().mockImplementation((content, sectionName) => {
    // Different sections in tests should return appropriate mock data
    if (sectionName === 'Test implementation') {
      return { name: 'Test implementation', content: 'Existing test notes', startLine: 10, endLine: 12 };
    } else if (sectionName === 'Implementation notes') {
      return { name: 'Implementation notes', content: 'Existing implementation notes', startLine: 15, endLine: 17 };
    } else if (sectionName === 'Refactoring') {
      return { name: 'Refactoring', content: 'Existing refactoring notes', startLine: 20, endLine: 22 };
    } else if (sectionName === 'Failed approaches') {
      return { name: 'Failed approaches', content: 'Existing failed approaches', startLine: 25, endLine: 27 };
    } else if (sectionName === 'Questions to resolve') {
      return { name: 'Questions to resolve', content: 'Existing questions', startLine: 30, endLine: 32 };
    } else if (sectionName === 'Planned approach') {
      return { name: 'Planned approach', content: 'Existing approach', startLine: 5, endLine: 7 };
    } else {
      return { name: sectionName, content: `Sample content for ${sectionName}`, startLine: 35, endLine: 37 };
    }
  });
  sectionManager.normalizeSectionName = jest.fn().mockImplementation(name => {
    // Map common section name variations to standard names
    const nameMap = {
      'test': 'Test implementation',
      'implementation': 'Implementation notes',
      'refactor': 'Refactoring',
      'failed': 'Failed approaches',
      'questions': 'Questions to resolve',
      'approach': 'Planned approach'
    };
    return nameMap[name.toLowerCase()] || name;
  });
  
  // Setup mock behavior for template utils
  template.validateTemplate = jest.fn().mockResolvedValue(true);
  template.loadTemplate = jest.fn().mockResolvedValue('# Issue {{NUMBER}}: {{TITLE}}\n\n## Problem to be solved\n{{PROBLEM}}\n\n## Tasks\n{{TASKS}}');
  template.renderTemplate = jest.fn().mockReturnValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2 +unit-test');
  
  return {
    issueManager,
    taskParser,
    sectionManager,
    template
  };
}

/**
 * Configure mock functions for TDD workflow testing
 * 
 * @param {Object} mocks - Object containing mock functions to setup
 * @param {Function} mocks.getCurrentTask - Mock function for getCurrentTask
 * @param {Function} mocks.getCurrentIssue - Mock function for getCurrentIssue
 * @param {Function} mocks.getIssue - Mock function for getIssue
 * @param {string} taskDescription - Description of the task to use in mocks
 * @returns {Object} The configured mocks
 */
function setupTDDWorkflowMocks(mocks, taskDescription = 'Task 2 +unit-test') {
  // Setup mock getCurrentIssue to return a test issue
  mocks.getCurrentIssue.mockResolvedValue({
    issueNumber: '0001',
    title: 'Test Issue',
    content: `# Issue 0001: Test Issue

## Problem to be solved
Test problem description

## Tasks
- [ ] Task 1
- [ ] ${taskDescription}

## Planned approach
Existing approach notes

## Test implementation
Existing test notes

## Implementation notes
Existing implementation notes

## Refactoring
Existing refactoring notes

## Failed approaches
Existing failed approaches

## Questions to resolve
Existing questions`
  });

  // Setup mock getCurrentTask to return a TDD-related task
  mocks.getCurrentTask.mockResolvedValue({
    id: 'task-2',
    description: taskDescription,
    index: 1
  });

  return mocks;
}

/**
 * Execute a complete TDD workflow with different testing types
 * 
 * @param {string} testType - Type of test (unit-test, integration-test, e2e-test)
 * @returns {Promise<Object>} Results of the workflow execution
 */
async function executeTDDWorkflow(testType = 'unit-test') {
  // Define test data
  const taskDescription = `Implement feature with ${testType}`;
  
  // Execute the RED phase
  const taskResult = await mcp__getCurrentTask({});
  
  // Add a note documenting the test implementation (RED phase)
  const redPhaseResult = await mcp__addNote({
    section: 'Test implementation',
    note: `Created failing tests for the feature using ${testType}. The tests verify functionality X, Y, and Z.`
  });
  
  // Add a question during the RED phase
  const questionResult = await mcp__addQuestion({
    question: 'Should we use a different testing approach for edge case X?'
  });
  
  // Execute the GREEN phase
  const greenPhaseResult = await mcp__addNote({
    section: 'Implementation notes',
    note: `Implemented the feature with minimal code to pass ${testType}. All tests are now passing.`
  });
  
  // Execute the REFACTOR phase
  const refactorPhaseResult = await mcp__addNote({
    section: 'Refactoring',
    note: `Refactored the implementation to improve readability and performance. All ${testType} tests still pass.`
  });
  
  // Log a failed approach during the process
  const failureResult = await mcp__logFailure({
    approach: 'Initially tried to implement using approach X',
    reason: 'That approach was too complex and would be difficult to test'
  });
  
  // Complete the task
  const completeResult = await mcp__completeTask({});
  
  return {
    taskResult,
    redPhaseResult,
    questionResult,
    greenPhaseResult,
    refactorPhaseResult,
    failureResult,
    completeResult
  };
}

module.exports = {
  setupMocksForTDDWorkflow,
  setupTDDWorkflowMocks,
  executeTDDWorkflow
};