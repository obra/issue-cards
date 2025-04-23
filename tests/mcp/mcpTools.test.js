// ABOUTME: Tests for MCP tools used for AI integration
// ABOUTME: Verifies functionality of core MCP command wrappers

const { executeCommand } = require('../../src/index');

// Mock the output manager
jest.mock('../../src/utils/outputManager', () => {
  const originalModule = jest.requireActual('../../src/utils/outputManager');
  return {
    ...originalModule,
    configure: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    getCommandOutput: jest.fn(),
    resetCommandOutput: jest.fn(),
    reset: jest.fn(),
    transformOutput: jest.fn()
  };
});

// Mock the issue manager functions
jest.mock('../../src/utils/issueManager', () => ({
  getIssues: jest.fn(),
  getIssueByNumber: jest.fn(),
  isValidIssueNumber: jest.fn(),
  isValidIssueState: jest.fn(),
  getCurrentIssue: jest.fn(),
  getCurrentTask: jest.fn(),
  addTaskToIssue: jest.fn()
}));

// Validation is now handled by a separate module, so we'll mock it to always pass
jest.mock('../../src/mcp/validator', () => {
  const validator = jest.fn().mockReturnValue(null);
  return {
    validateArgs: validator,
    withValidation: jest.fn((nameOrFn, fn) => {
      // Handle both function or string+function signature
      return typeof fn === 'function' ? fn : nameOrFn;
    }),
    schemas: {}
  };
});

// Import MCP tools
const { 
  mcp__listIssues,
  mcp__showIssue,
  mcp__getCurrentTask,
  mcp__addTask
} = require('../../src/mcp/tools');

describe('MCP Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('mcp__listIssues', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__listIssues).toBe('function');
    });
    
    it('should return a list of issue objects when called', async () => {
      // Mock the issueManager.getIssues to return sample issues
      const mockIssues = [
        { issueNumber: '0001', title: 'First issue', state: 'open' },
        { issueNumber: '0002', title: 'Second issue', state: 'closed' }
      ];
      require('../../src/utils/issueManager').getIssues.mockResolvedValue(mockIssues);
      
      // Call the function and verify the result
      const result = await mcp__listIssues({ state: 'all' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ issueNumber: '0001' }),
        expect.objectContaining({ issueNumber: '0002' })
      ]));
      // Check that workflowGuidance is present
      expect(result.workflowGuidance).toBeDefined();
    });
    
    it('should filter issues by state when specified', async () => {
      // Mock the issueManager.getIssues to return filtered issues
      const mockOpenIssues = [{ issueNumber: '0001', title: 'First issue', state: 'open' }];
      require('../../src/utils/issueManager').getIssues.mockResolvedValue(mockOpenIssues);
      
      // Call the function with state=open and verify the result
      const result = await mcp__listIssues({ state: 'open' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ issueNumber: '0001', state: 'open' })
      ]));
      // Check that workflowGuidance is present
      expect(result.workflowGuidance).toBeDefined();
      
      // Verify getIssues was called with the correct state
      expect(require('../../src/utils/issueManager').getIssues).toHaveBeenCalledWith('open');
    });
    
    it('should handle errors properly', async () => {
      // Mock the issueManager.getIssues to throw an error
      require('../../src/utils/issueManager').getIssues.mockRejectedValue(new Error('Failed to get issues'));
      
      // Call the function and verify error handling
      const result = await mcp__listIssues({});
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('listIssues')
        })
      });
    });
  });
  
  describe('mcp__showIssue', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__showIssue).toBe('function');
    });
    
    it('should return issue details when called with a valid issue number', async () => {
      // Mock the issueManager.getIssueByNumber to return a sample issue
      const mockIssue = {
        issueNumber: '0001',
        title: 'Test Issue',
        description: 'This is a test issue',
        state: 'open',
        tasks: [
          { id: 1, description: 'Task 1', completed: false },
          { id: 2, description: 'Task 2', completed: true }
        ]
      };
      require('../../src/utils/issueManager').getIssueByNumber.mockResolvedValue(mockIssue);
      
      // Call the function and verify the result
      const result = await mcp__showIssue({ issueNumber: '0001' });
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          issueNumber: '0001',
          title: 'Test Issue',
          tasks: expect.arrayContaining([
            expect.objectContaining({ id: 1 }),
            expect.objectContaining({ id: 2 })
          ])
        })
      });
      
      // Verify getIssueByNumber was called with the correct issue number
      expect(require('../../src/utils/issueManager').getIssueByNumber).toHaveBeenCalledWith('0001');
    });
    
    it('should handle errors when getting issue details', async () => {
      // Mock getIssueByNumber to fail
      require('../../src/utils/issueManager').getIssueByNumber.mockRejectedValue(new Error('Issue not found'));
      
      // Call the function and verify error handling
      const result = await mcp__showIssue({ issueNumber: '9999' });
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'NotFoundError',
          message: expect.stringContaining('Issue #9999 not found')
        })
      });
    });
  });
  
  describe('mcp__getCurrentTask', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__getCurrentTask).toBe('function');
    });
    
    it('should return the current task when there is an active issue with current task', async () => {
      // Mock the getCurrentIssue and getCurrentTask to return sample data
      const mockCurrentIssue = {
        issueNumber: '0001',
        title: 'Current Issue'
      };
      const mockCurrentTask = {
        id: 1,
        description: 'Current Task',
        completed: false,
        contextData: {
          problem: 'Problem to solve',
          approach: 'Planned approach'
        }
      };
      
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue(mockCurrentIssue);
      require('../../src/utils/issueManager').getCurrentTask.mockResolvedValue(mockCurrentTask);
      
      // Call the function and verify the result
      const result = await mcp__getCurrentTask({});
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          issueNumber: '0001',
          issueTitle: 'Current Issue',
          taskId: 1,
          description: 'Current Task',
          context: expect.objectContaining({
            problem: 'Problem to solve'
          })
        })
      });
    });
    
    it('should handle the case when there is no current issue', async () => {
      // Mock getCurrentIssue to return null
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue(null);
      
      // Call the function and verify the result
      const result = await mcp__getCurrentTask({});
      expect(result).toEqual({
        success: true,
        data: null
      });
    });
    
    it('should handle the case when there is a current issue but no current task', async () => {
      // Mock getCurrentIssue to return an issue but getCurrentTask to return null
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue({
        issueNumber: '0001',
        title: 'Current Issue'
      });
      require('../../src/utils/issueManager').getCurrentTask.mockResolvedValue(null);
      
      // Call the function and verify the result
      const result = await mcp__getCurrentTask({});
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          issueNumber: '0001',
          issueTitle: 'Current Issue',
          taskId: null,
          description: null
        })
      });
    });
    
    it('should handle errors properly', async () => {
      // Mock getCurrentIssue to throw an error
      require('../../src/utils/issueManager').getCurrentIssue.mockRejectedValue(new Error('Failed to get current issue'));
      
      // Call the function and verify error handling
      const result = await mcp__getCurrentTask({});
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('getCurrentTask')
        })
      });
    });
  });
  
  describe('mcp__addTask', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__addTask).toBe('function');
    });
    
    it('should add a task to the specified issue and return success', async () => {
      // Mock dependency functions
      require('../../src/utils/issueManager').addTaskToIssue.mockResolvedValue({
        id: 3,
        description: 'New task',
        completed: false
      });
      
      // Call the function and verify the result
      const result = await mcp__addTask({
        issueNumber: '0001',
        description: 'New task'
      });
      
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 3,
          description: 'New task'
        })
      });
      
      // Verify addTaskToIssue was called with correct parameters
      expect(require('../../src/utils/issueManager').addTaskToIssue)
        .toHaveBeenCalledWith('0001', 'New task');
    });
    
    it('should handle errors when adding a task', async () => {
      // Mock validation to pass but addTaskToIssue to fail
      require('../../src/utils/issueManager').addTaskToIssue.mockRejectedValue(
        new Error('Failed to add task')
      );
      
      // Call the function and verify error handling
      const result = await mcp__addTask({
        issueNumber: '0001',
        description: 'New task'
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'NotFoundError'
        })
      });
    });
  });
});