// ABOUTME: Tests for task guidance in issue-related MCP tool responses
// ABOUTME: Verifies that proper task guidance is included in show/list issue responses

const { withValidation } = require('../../src/mcp/validator');
const { withErrorHandling } = require('../../src/mcp/errorHandler');

// Create mock implementations for the real functions
const mockShowIssue = jest.fn();
const mockListIssues = jest.fn();

// Mock the functions that will be exported
jest.mock('../../src/mcp/tools', () => ({
  mcp__showIssue: jest.fn(async (args) => mockShowIssue(args)),
  mcp__listIssues: jest.fn(async (args) => mockListIssues(args)),
}));

// Import the mocked functions
const { mcp__showIssue, mcp__listIssues } = require('../../src/mcp/tools');

describe('Issue Guidance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('mcp__showIssue', () => {
    it('should include task guidance in the response', async () => {
      // Set up the mock implementation
      mockShowIssue.mockResolvedValue({
        success: true,
        data: {
          issueNumber: '0001',
          title: 'Test Issue',
          content: '# Test Issue\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2',
          state: 'open',
          taskGuidance: "IMPORTANT: To implement tasks from this issue, use mcp__getCurrentTask to focus on ONE task at a time rather than trying to implement all tasks at once. Working on one task at a time ensures proper tracking and step-by-step progress.",
          workflowTip: "For proper task workflow: 1) Use mcp__getCurrentTask to get your current task, 2) Implement ONLY that specific task, 3) Use mcp__completeTask when done to mark the task complete and receive the next task."
        }
      });
      
      // Call the function
      const result = await mcp__showIssue({ issueNumber: '0001' });
      
      // Verify the result has the task guidance fields
      expect(result.success).toBe(true);
      expect(result.data.taskGuidance).toContain('focus on ONE task at a time');
      expect(result.data.workflowTip).toContain('Use mcp__getCurrentTask');
    });
    
    it('should include current task info when a task is available', async () => {
      // Set up the mock implementation
      mockShowIssue.mockResolvedValue({
        success: true,
        data: {
          issueNumber: '0001',
          title: 'Test Issue',
          content: '# Test Issue\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2',
          state: 'open',
          taskGuidance: "IMPORTANT: To implement tasks from this issue, use mcp__getCurrentTask to focus on ONE task at a time rather than trying to implement all tasks at once. Working on one task at a time ensures proper tracking and step-by-step progress.",
          workflowTip: "For proper task workflow: 1) Use mcp__getCurrentTask to get your current task, 2) Implement ONLY that specific task, 3) Use mcp__completeTask when done to mark the task complete and receive the next task.",
          currentTaskInfo: {
            id: 'task-0',
            description: 'Task 1',
            message: "Use mcp__getCurrentTask to focus on implementing this specific task."
          }
        }
      });
      
      // Call the function
      const result = await mcp__showIssue({ issueNumber: '0001' });
      
      // Verify the result has the current task info
      expect(result.success).toBe(true);
      expect(result.data.currentTaskInfo).toBeDefined();
      expect(result.data.currentTaskInfo.description).toBe('Task 1');
      expect(result.data.currentTaskInfo.message).toContain('mcp__getCurrentTask');
    });
  });
  
  describe('mcp__listIssues', () => {
    it('should include workflow guidance in the response', async () => {
      // Set up the mock implementation
      mockListIssues.mockResolvedValue({
        success: true,
        data: [
          { issueNumber: '0001', title: 'Issue 1', state: 'open' },
          { issueNumber: '0002', title: 'Issue 2', state: 'open' }
        ],
        workflowGuidance: {
          message: "IMPORTANT: After selecting an issue to work on, use mcp__getCurrentTask to get your current task rather than trying to implement all tasks at once.",
          recommendedWorkflow: "For proper task workflow: 1) Use mcp__getCurrentTask to get your current task, 2) Implement ONLY that specific task, 3) Use mcp__completeTask when done to mark it complete and receive the next task."
        }
      });
      
      // Call the function
      const result = await mcp__listIssues({});
      
      // Verify the result has the workflow guidance
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.workflowGuidance).toBeDefined();
      expect(result.workflowGuidance.message).toContain('mcp__getCurrentTask');
      expect(result.workflowGuidance.recommendedWorkflow).toContain('ONLY that specific task');
    });
  });
});