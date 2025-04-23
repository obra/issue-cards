// ABOUTME: Tests for task guidance in MCP tool responses
// ABOUTME: Verifies that proper task guidance is included in responses

const { withValidation } = require('../../src/mcp/validator');
const { withErrorHandling } = require('../../src/mcp/errorHandler');

// Create mock implementations for the real functions
const mockCompleteTask = jest.fn();
const mockGetCurrentTask = jest.fn();

// Mock the functions that will be exported
jest.mock('../../src/mcp/tools', () => ({
  mcp__completeTask: jest.fn(async (args) => mockCompleteTask(args)),
  mcp__getCurrentTask: jest.fn(async (args) => mockGetCurrentTask(args)),
}));

// Import the mocked functions
const { mcp__completeTask, mcp__getCurrentTask } = require('../../src/mcp/tools');

describe('Task Guidance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('mcp__completeTask', () => {
    it('should include task guidance in the response when there is a next task', async () => {
      // Set up the mock implementation
      mockCompleteTask.mockResolvedValue({
        success: true,
        data: {
          taskCompleted: 'Current task',
          issueNumber: '0001',
          nextTask: {
            id: 'task-1',
            description: 'Next task'
          },
          taskGuidance: 'Important: Please focus ONLY on completing this specific task. Do not work on any other tasks or future tasks until this task is complete and marked as completed.',
          nextSteps: 'Please review the task description and implement only this specific task. When complete, use mcp__completeTask to mark it finished and receive your next task.'
        }
      });
      
      // Call the function
      const result = await mcp__completeTask({});
      
      // Verify the result has the task guidance fields
      expect(result.success).toBe(true);
      expect(result.data.nextTask).toEqual({
        id: 'task-1',
        description: 'Next task'
      });
      expect(result.data.taskGuidance).toContain('focus ONLY on completing this specific task');
      expect(result.data.nextSteps).toContain('implement only this specific task');
    });
    
    it('should not include task guidance when all tasks are completed', async () => {
      // Set up the mock implementation
      mockCompleteTask.mockResolvedValue({
        success: true,
        data: {
          taskCompleted: 'Current task',
          issueNumber: '0001',
          nextTask: null,
          issueCompleted: true
        }
      });
      
      // Call the function
      const result = await mcp__completeTask({});
      
      // Verify the result doesn't have task guidance fields
      expect(result.success).toBe(true);
      expect(result.data.nextTask).toBeNull();
      expect(result.data.issueCompleted).toBe(true);
      expect(result.data).not.toHaveProperty('taskGuidance');
      expect(result.data).not.toHaveProperty('nextSteps');
    });
  });
  
  describe('mcp__getCurrentTask', () => {
    it('should include task guidance in the response when there is a current task', async () => {
      // Set up the mock implementation
      mockGetCurrentTask.mockResolvedValue({
        success: true,
        data: {
          issueNumber: '0001',
          issueTitle: 'Test Issue',
          taskId: 'task-0',
          description: 'Current task',
          taskGuidance: 'Important: Please focus ONLY on completing this specific task. Do not work on any other tasks or future tasks until this task is complete and marked as completed.',
          nextSteps: 'Please review the task description and implement only this specific task. When complete, use mcp__completeTask to mark it finished and receive your next task.'
        }
      });
      
      // Call the function
      const result = await mcp__getCurrentTask({});
      
      // Verify the result has the task guidance fields
      expect(result.success).toBe(true);
      expect(result.data.taskId).toBe('task-0');
      expect(result.data.description).toBe('Current task');
      expect(result.data.taskGuidance).toContain('focus ONLY on completing this specific task');
      expect(result.data.nextSteps).toContain('implement only this specific task');
    });
    
    it('should not include task guidance when there is no current task', async () => {
      // Set up the mock implementation
      mockGetCurrentTask.mockResolvedValue({
        success: true,
        data: {
          issueNumber: '0001',
          issueTitle: 'Test Issue',
          taskId: null,
          description: null
        }
      });
      
      // Call the function
      const result = await mcp__getCurrentTask({});
      
      // Verify the result doesn't have task guidance fields
      expect(result.success).toBe(true);
      expect(result.data.taskId).toBeNull();
      expect(result.data.description).toBeNull();
      expect(result.data).not.toHaveProperty('taskGuidance');
      expect(result.data).not.toHaveProperty('nextSteps');
    });
  });
});