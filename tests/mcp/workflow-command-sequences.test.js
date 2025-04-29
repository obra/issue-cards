// ABOUTME: Tests for MCP workflow command sequences
// ABOUTME: Verifies behavior of command sequences for different workflows

const { 
  mcp__createIssue,
  mcp__getCurrentTask,
  mcp__addNote,
  mcp__addQuestion,
  mcp__logFailure,
  mcp__completeTask
} = require('../../src/mcp/tools');

// Importing the task parser to mock findCurrentTask
const taskParser = require('../../src/utils/taskParser');

// Mock the required dependencies
jest.mock('../../src/utils/issueManager', () => ({
  getNextIssueNumber: jest.fn(),
  saveIssue: jest.fn().mockResolvedValue(true),
  getCurrentIssue: jest.fn(),
  getCurrentTask: jest.fn(),
  getIssue: jest.fn().mockImplementation((issueNumber) => {
    // Return mock issue content with all necessary sections
    return Promise.resolve(`# Issue ${issueNumber}: Test Issue

## Problem to be solved
Test problem description

## Tasks
- [ ] Task 1
- [ ] Task 2 +unit-test

## Planned approach
Existing approach

## Test implementation
Existing test notes

## Implementation notes
Existing implementation notes

## Refactoring
Existing refactoring notes

## Failed approaches
Existing failed approaches

## Questions to resolve
Existing questions`);
  }),
  extractTasks: jest.fn(),
  updateTaskStatus: jest.fn(),
  closeIssue: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../src/utils/template', () => ({
  validateTemplate: jest.fn(),
  loadTemplate: jest.fn(),
  renderTemplate: jest.fn()
}));

jest.mock('../../src/utils/taskParser', () => ({
  extractTasks: jest.fn().mockImplementation(content => {
    // Extract tasks from the mock content
    const tasks = [
      { id: 'task-1', text: 'Task 1', completed: false, index: 0 },
      { id: 'task-2', text: 'Task 2 +unit-test', completed: false, index: 1 },
      { id: 'task-3', text: 'Task 3 +integration-test', completed: false, index: 2 },
      { id: 'task-4', text: 'Task 4 +e2e-test', completed: false, index: 3 }
    ];
    return tasks;
  }),
  findCurrentTask: jest.fn().mockImplementation(tasks => {
    // Find the first uncompleted task
    return tasks.find(task => !task.completed) || null;
  }),
  updateTaskStatus: jest.fn().mockImplementation((content, taskIndex, completed) => {
    // Mock updating task status by modifying the task marker in content
    const lines = content.split('\n');
    
    // Find the Tasks section and its tasks
    let inTasksSection = false;
    let taskCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## Tasks')) {
        inTasksSection = true;
        continue;
      }
      
      if (inTasksSection && lines[i].startsWith('## ')) {
        inTasksSection = false;
        break;
      }
      
      if (inTasksSection && lines[i].match(/^- \[[x ]\]/)) {
        if (taskCount === taskIndex) {
          // This is the task to update
          lines[i] = lines[i].replace(/\[[ x]\]/, completed ? '[x]' : '[ ]');
          break;
        }
        taskCount++;
      }
    }
    
    return lines.join('\n');
  })
}));

jest.mock('../../src/utils/sectionManager', () => ({
  addContentToSection: jest.fn().mockImplementation((content, sectionName, newContent, format, options) => {
    // Mock implementation that adds content to the section
    return content + `\n\n## ${sectionName}\n${newContent}`;
  }),
  findSectionByName: jest.fn().mockImplementation((content, sectionName) => {
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
  }),
  normalizeSectionName: jest.fn().mockImplementation(name => {
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
  })
}));

const {
  getNextIssueNumber,
  saveIssue,
  getCurrentIssue,
  getCurrentTask,
  getIssue,
  closeIssue
} = require('../../src/utils/issueManager');

const {
  validateTemplate,
  loadTemplate,
  renderTemplate
} = require('../../src/utils/template');

describe('MCP Workflow Command Sequences', () => {
  // Setup test data and reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getNextIssueNumber to return a test issue number
    getNextIssueNumber.mockResolvedValue('0001');
    
    // Mock validateTemplate to return true
    validateTemplate.mockResolvedValue(true);
    
    // Mock loadTemplate to return sample template content
    loadTemplate.mockResolvedValue('# Issue {{NUMBER}}: {{TITLE}}\n\n## Problem to be solved\n{{PROBLEM}}\n\n## Tasks\n{{TASKS}}');
    
    // Mock renderTemplate to return sample issue content
    renderTemplate.mockReturnValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2 +unit-test');
    
    // Mock saveIssue to return success
    saveIssue.mockResolvedValue(true);
    
    // Mock getCurrentIssue to return test issue
    getCurrentIssue.mockResolvedValue({
      issueNumber: '0001',
      title: 'Test Issue',
      content: '# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2 +unit-test'
    });
    
    // Mock getIssue to return test issue content
    getIssue.mockResolvedValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2 +unit-test\n\n## Planned approach\n\n## Test implementation\n\n## Implementation notes\n\n## Refactoring\n\n## Failed approaches\n\n## Questions to resolve');
    
    // Mock task parser functions
    taskParser.extractTasks.mockReturnValue([
      { id: 'task-1', text: 'Task 1', completed: false, index: 0 },
      { id: 'task-2', text: 'Task 2 +unit-test', completed: false, index: 1 }
    ]);
    
    taskParser.findCurrentTask.mockReturnValue(
      { id: 'task-1', text: 'Task 1', completed: false, index: 0 }
    );
    
    taskParser.updateTaskStatus.mockResolvedValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [x] Task 1\n- [ ] Task 2 +unit-test');
    
    // Mock section functions
    require('../../src/utils/sectionManager').addContentToSection.mockReturnValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nTest problem\n\n## Tasks\n- [x] Task 1\n- [ ] Task 2 +unit-test\n\n## Planned approach\nNew content');
  });
  
  describe('Basic Issue Creation and Task Management', () => {
    it('should create an issue and get the first task', async () => {
      // 1. Create an issue
      const createResult = await mcp__createIssue({
        template: 'feature',
        title: 'Test Issue',
        problem: 'Test problem',
        task: ['Task 1', 'Task 2 +unit-test']
      });
      
      // Verify create issue result
      expect(createResult.success).toBe(true);
      expect(createResult.data.issueNumber).toBe('0001');
      expect(createResult.data.title).toBe('Test Issue');
      
      // Set getCurrentTask mock for the next call
      getCurrentTask.mockResolvedValueOnce({
        id: 'task-1',
        description: 'Task 1',
        index: 0
      });
      
      // 2. Get the current task
      const taskResult = await mcp__getCurrentTask({});
      
      // Verify current task result
      expect(taskResult.success).toBe(true);
      expect(taskResult.data.taskId).toBe('task-1');
      expect(taskResult.data.description).toBe('Task 1');
      expect(taskResult.data.workflowGuidance).toBeDefined();
    });
  });
  
  describe('TDD Workflow Command Sequences', () => {
    // Setup TDD-related tasks
    beforeEach(() => {
      // Set the current task to be TDD-related
      getCurrentTask.mockResolvedValue({
        id: 'task-2',
        description: 'Task 2 +unit-test',
        index: 1
      });
    });
    
    it('should execute the RED phase of TDD', async () => {
      // 1. Get the TDD task
      const taskResult = await mcp__getCurrentTask({});
      
      // Verify it's the TDD task with proper guidance
      expect(taskResult.success).toBe(true);
      expect(taskResult.data.description).toBe('Task 2 +unit-test');
      expect(taskResult.data.workflowGuidance).toBeDefined();
      
      // 2. Add a note documenting the test implementation (RED phase)
      const noteResult = await mcp__addNote({
        section: 'Test implementation',
        note: 'Created failing tests for user authentication. Tests verify credentials validation, token generation, and access control. All tests are failing because implementation is missing.'
      });
      
      // Verify note was added
      expect(noteResult.success).toBe(true);
      expect(noteResult.data.section).toBe('Test implementation');
      expect(noteResult.data.noteAdded).toBe(true);
    });
    
    it('should execute the GREEN phase of TDD', async () => {
      // Assuming RED phase has been completed
      
      // Add a note documenting the implementation (GREEN phase)
      const noteResult = await mcp__addNote({
        section: 'Implementation notes',
        note: 'Implemented user authentication with credential validation, token generation, and access control. All tests now pass with this implementation.'
      });
      
      // Verify note was added
      expect(noteResult.success).toBe(true);
      expect(noteResult.data.section).toBe('Implementation notes');
      expect(noteResult.data.noteAdded).toBe(true);
    });
    
    it('should execute the REFACTOR phase of TDD', async () => {
      // Assuming GREEN phase has been completed
      
      // Add a note documenting the refactoring (REFACTOR phase)
      const noteResult = await mcp__addNote({
        section: 'Refactoring',
        note: 'Refactored authentication implementation to improve separation of concerns. Extracted validation logic, improved error handling, and optimized token generation. All tests still pass after these improvements.'
      });
      
      // Verify note was added
      expect(noteResult.success).toBe(true);
      expect(noteResult.data.section).toBe('Refactoring');
      expect(noteResult.data.noteAdded).toBe(true);
    });
    
    it('should log a failed approach during TDD', async () => {
      // Log a failed approach during TDD implementation
      const failureResult = await mcp__logFailure({
        approach: 'Initially tried to use simple password validation',
        reason: 'Too basic for security requirements, switched to more comprehensive approach'
      });
      
      // Verify failure was logged
      expect(failureResult.success).toBe(true);
      expect(failureResult.data.approachLogged).toBe(true);
    });
    
    it('should ask a clarifying question during TDD', async () => {
      // Ask a question during TDD implementation
      const questionResult = await mcp__addQuestion({
        question: 'Should we implement rate limiting for authentication attempts?'
      });
      
      // Verify question was added
      expect(questionResult.success).toBe(true);
      expect(questionResult.data.questionAdded).toBe(true);
    });
  });
  
  describe('Complete TDD Workflow Sequence', () => {
    it('should follow a complete TDD workflow with proper guidance', async () => {
      // Setup mocks for TDD-related task
      getCurrentTask.mockResolvedValue({
        id: 'task-2',
        description: 'Task 2 +unit-test',
        index: 1
      });
      
      // Get the TDD task
      const taskResult = await mcp__getCurrentTask({});
      
      // Verify it has the proper TDD guidance
      expect(taskResult.success).toBe(true);
      expect(taskResult.data.description).toBe('Task 2 +unit-test');
      expect(taskResult.data.workflowGuidance).toBeDefined();
      
      // Verify TDD guidance is provided for tasks with TDD tags
      if (taskResult.data.description.includes('+unit-test') || 
          taskResult.data.description.includes('+e2e-test') || 
          taskResult.data.description.includes('+integration-test')) {
        expect(taskResult.data.workflowGuidance.tddGuidance).toBeDefined();
        expect(taskResult.data.workflowGuidance.tddGuidance.tddSteps).toBeDefined();
        expect(taskResult.data.workflowGuidance.tddGuidance.tddSteps.length).toBeGreaterThan(0);
      }
    });
    
    it('should execute a complete TDD workflow for unit tests', async () => {
      // Import the helper
      const { executeTDDWorkflow } = require('./workflow-command-sequence-helper');
      
      // Setup mocks for unit testing
      getCurrentTask.mockResolvedValue({
        id: 'task-2',
        description: 'Task 2 +unit-test',
        index: 1
      });
      
      getCurrentIssue.mockResolvedValue({
        issueNumber: '0001',
        title: 'Test Issue',
        content: `# Issue 0001: Test Issue

## Problem to be solved
Test problem description

## Tasks
- [ ] Task 1
- [ ] Task 2 +unit-test

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
      
      // Execute the test workflow and verify results
      const results = await executeTDDWorkflow('unit-test');
      
      // Verify that each phase was executed successfully
      expect(results.taskResult.success).toBe(true);
      expect(results.redPhaseResult.success).toBe(true);
      expect(results.questionResult.success).toBe(true);
      expect(results.greenPhaseResult.success).toBe(true);
      expect(results.refactorPhaseResult.success).toBe(true);
      expect(results.failureResult.success).toBe(true);
      expect(results.completeResult.success).toBe(true);
      
      // Verify TDD guidance was included in the task result
      expect(results.taskResult.data.workflowGuidance?.tddGuidance).toBeDefined();
      
      // Verify that the notes were added to the correct sections
      expect(results.redPhaseResult.data.section).toBe('Test implementation');
      expect(results.greenPhaseResult.data.section).toBe('Implementation notes');
      expect(results.refactorPhaseResult.data.section).toBe('Refactoring');
      expect(results.questionResult.data.questionAdded).toBe(true);
      expect(results.failureResult.data.approachLogged).toBe(true);
    });
  });
  
  describe('Different Testing Type Guidance', () => {
    it('should provide guidance for unit testing tasks', async () => {
      // Set the current task to be unit testing related
      getCurrentTask.mockResolvedValue({
        id: 'task-2',
        description: 'Task 2 +unit-test',
        index: 1
      });
      
      // Get the unit test task
      const taskResult = await mcp__getCurrentTask({});
      
      // Verify it has TDD guidance
      expect(taskResult.success).toBe(true);
      expect(taskResult.data.description).toBe('Task 2 +unit-test');
      expect(taskResult.data.workflowGuidance.tddGuidance).toBeDefined();
    });
    
    it('should provide guidance for integration testing tasks', async () => {
      // Set the current task to be integration testing related
      getCurrentTask.mockResolvedValue({
        id: 'task-3',
        description: 'Task 3 +integration-test',
        index: 2
      });
      
      // Get the integration test task
      const taskResult = await mcp__getCurrentTask({});
      
      // Verify it has TDD guidance
      expect(taskResult.success).toBe(true);
      expect(taskResult.data.description).toBe('Task 3 +integration-test');
      expect(taskResult.data.workflowGuidance.tddGuidance).toBeDefined();
    });
    
    it('should provide guidance for E2E testing tasks', async () => {
      // Set the current task to be E2E testing related
      getCurrentTask.mockResolvedValue({
        id: 'task-4',
        description: 'Task 4 +e2e-test',
        index: 3
      });
      
      // Get the E2E test task
      const taskResult = await mcp__getCurrentTask({});
      
      // Verify it has TDD guidance
      expect(taskResult.success).toBe(true);
      expect(taskResult.data.description).toBe('Task 4 +e2e-test');
      expect(taskResult.data.workflowGuidance.tddGuidance).toBeDefined();
    });
    
    it('should execute TDD workflows for different test types', async () => {
      // Import the helper
      const { executeTDDWorkflow } = require('./workflow-command-sequence-helper');
      
      // Test all three testing types
      const testTypes = ['unit-test', 'integration-test', 'e2e-test'];
      
      for (const testType of testTypes) {
        // Configure mocks for this test type
        const taskDescription = `Task with +${testType}`;
        
        getCurrentTask.mockResolvedValue({
          id: 'task-2',
          description: taskDescription,
          index: 1
        });
        
        getCurrentIssue.mockResolvedValue({
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
        
        // Execute the test workflow for this test type
        const results = await executeTDDWorkflow(testType);
        
        // Verify that all phases completed successfully
        expect(results.taskResult.success).toBe(true);
        expect(results.redPhaseResult.success).toBe(true);
        expect(results.questionResult.success).toBe(true);
        expect(results.greenPhaseResult.success).toBe(true);
        expect(results.refactorPhaseResult.success).toBe(true);
        expect(results.failureResult.success).toBe(true);
        expect(results.completeResult.success).toBe(true);
        
        // Verify TDD-specific guidance was included
        expect(results.taskResult.data.workflowGuidance?.tddGuidance).toBeDefined();
        expect(results.taskResult.data.workflowGuidance?.tddGuidance.tddSteps.length).toBe(3);
        
        // Verify the resulting notes include the test type
        expect(results.redPhaseResult.data.noteAdded).toBe(true);
        expect(results.greenPhaseResult.data.noteAdded).toBe(true);
        expect(results.refactorPhaseResult.data.noteAdded).toBe(true);
      }
    });
  });
});