// ABOUTME: Unit tests for onboarding MCP tools
// ABOUTME: Tests integration with the documentationParser

const {
  mcp__onboarding,
  mcp__workflow,
  mcp__pm,
  mcp__dev,
  mcp__reviewer
} = require('../../src/mcp/onboardingTools');

// Mock the documentationParser
jest.mock('../../src/utils/documentationParser', () => ({
  loadRoleDoc: jest.fn(),
  loadWorkflowDoc: jest.fn(),
  listWorkflows: jest.fn()
}));

// Import the mock to control it
const {
  loadRoleDoc,
  loadWorkflowDoc,
  listWorkflows
} = require('../../src/utils/documentationParser');

describe('onboardingTools', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock implementation for loadRoleDoc
    loadRoleDoc.mockImplementation((role) => {
      if (role === 'pm' || role === 'project-manager') {
        return {
          title: 'Project Manager Onboarding',
          description: 'PM description',
          workflows: [
            '[Create Feature](../workflows/create-feature.md)',
            '[Bugfix](../workflows/bugfix.md)'
          ],
          bestPractices: [
            'Practice 1',
            'Practice 2'
          ],
          toolExamples: []
        };
      } else if (role === 'developer' || role === 'dev') {
        return {
          title: 'Developer Onboarding',
          description: 'Developer description',
          workflows: [
            '[Task Management](../workflows/task-management.md)'
          ],
          bestPractices: [
            'Practice 3',
            'Practice 4'
          ],
          toolExamples: []
        };
      } else if (role === 'reviewer') {
        return {
          title: 'Reviewer Onboarding',
          description: 'Reviewer description',
          workflows: [
            '[Review](../workflows/review.md)'
          ],
          bestPractices: [
            'Practice 5',
            'Practice 6'
          ],
          toolExamples: []
        };
      } else {
        throw new Error(`Unknown role: ${role}`);
      }
    });
    
    // Setup mock implementation for loadWorkflowDoc
    loadWorkflowDoc.mockImplementation((workflow) => {
      if (workflow === 'create-feature') {
        return {
          title: 'Create Feature Issue Workflow',
          description: 'Guide for creating feature issues',
          steps: [
            'Step 1 using `mcp__listTemplates`',
            'Step 2 using `mcp__createIssue`'
          ],
          exampleToolSequence: [
            { tool: 'mcp__listTemplates', args: { type: 'issue' } },
            { tool: 'mcp__createIssue', args: { template: 'feature' } }
          ],
          tips: [
            'Tip 1',
            'Tip 2'
          ]
        };
      } else if (workflow === 'bugfix') {
        return {
          title: 'Bugfix Workflow',
          description: 'Guide for fixing bugs',
          steps: [
            'Step 1 using `mcp__createIssue`',
            'Step 2 using `mcp__getCurrentTask`'
          ],
          exampleToolSequence: null,
          tips: [
            'Tip 3',
            'Tip 4'
          ]
        };
      } else {
        throw new Error(`Unknown workflow: ${workflow}`);
      }
    });
    
    // Setup mock implementation for listWorkflows
    listWorkflows.mockReturnValue([
      { id: 'create-feature', title: 'Create Feature Issue Workflow', description: 'Guide for creating feature issues' },
      { id: 'bugfix', title: 'Bugfix Workflow', description: 'Guide for fixing bugs' },
      { id: 'task-management', title: 'Task Management Workflow', description: 'Guide for managing tasks' }
    ]);
  });
  
  describe('mcp__onboarding', () => {
    it('should return role-specific documentation for PM', async () => {
      const result = await mcp__onboarding({ role: 'pm' });
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Project Manager Onboarding');
      expect(result.data.description).toBe('PM description');
      expect(result.data.workflows).toHaveLength(2);
      expect(result.data.workflows[0].name).toBe('Create Feature');
      expect(result.data.bestPractices).toEqual(['Practice 1', 'Practice 2']);
      
      // Verify the documentation parser was called with the right role
      expect(loadRoleDoc).toHaveBeenCalledWith('pm');
    });
    
    it('should return role-specific documentation for developer', async () => {
      const result = await mcp__onboarding({ role: 'developer' });
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Developer Onboarding');
      expect(result.data.description).toBe('Developer description');
      expect(result.data.workflows).toHaveLength(1);
      expect(result.data.workflows[0].name).toBe('Task Management');
      expect(result.data.bestPractices).toEqual(['Practice 3', 'Practice 4']);
      
      // Verify the documentation parser was called with the right role
      expect(loadRoleDoc).toHaveBeenCalledWith('developer');
    });
    
    it('should default to PM role when none specified', async () => {
      const result = await mcp__onboarding({});
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Project Manager Onboarding');
      
      // Verify the documentation parser was called with the default role
      expect(loadRoleDoc).toHaveBeenCalledWith('pm');
    });
    
    it('should handle invalid roles with error response', async () => {
      // Mock loadRoleDoc to throw for unknown role
      loadRoleDoc.mockImplementationOnce(() => {
        throw new Error('Unknown role');
      });
      
      const result = await mcp__onboarding({ role: 'invalid' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('ValidationError');
    });
  });
  
  describe('mcp__workflow', () => {
    it('should return workflow-specific documentation', async () => {
      const result = await mcp__workflow({ workflow: 'create-feature' });
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Create Feature Issue Workflow');
      expect(result.data.description).toBe('Guide for creating feature issues');
      expect(result.data.steps).toHaveLength(2);
      expect(result.data.tips).toEqual(['Tip 1', 'Tip 2']);
      
      // Verify steps format
      expect(result.data.steps[0].step).toBe(1);
      expect(result.data.steps[0].description).toBe('Step 1 using `mcp__listTemplates`');
      expect(result.data.steps[0].tool).toBe('mcp__listTemplates');
      
      // Verify the documentation parser was called with the right workflow
      expect(loadWorkflowDoc).toHaveBeenCalledWith('create-feature');
    });
    
    it('should list available workflows when no specific workflow requested', async () => {
      const result = await mcp__workflow({});
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Available Workflows');
      expect(result.data.workflows).toHaveLength(3);
      expect(result.data.workflows[0].id).toBe('create-feature');
      expect(result.data.workflows[1].id).toBe('bugfix');
      
      // Verify listWorkflows was called
      expect(listWorkflows).toHaveBeenCalled();
      // Verify loadWorkflowDoc was NOT called
      expect(loadWorkflowDoc).not.toHaveBeenCalled();
    });
    
    it('should handle invalid workflows with error response', async () => {
      // Mock loadWorkflowDoc to throw for unknown workflow
      loadWorkflowDoc.mockImplementationOnce(() => {
        throw new Error('Unknown workflow');
      });
      
      const result = await mcp__workflow({ workflow: 'invalid' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('ValidationError');
      expect(result.error.message).toContain('Unknown workflow');
    });
    
    it('should handle workflows without example tool sequence', async () => {
      const result = await mcp__workflow({ workflow: 'bugfix' });
      
      expect(result.success).toBe(true);
      expect(result.data.exampleToolSequence).toBeNull();
    });
  });
  
  describe('Role aliases', () => {
    it('mcp__pm should call loadRoleDoc with pm role', async () => {
      await mcp__pm({});
      expect(loadRoleDoc).toHaveBeenCalledWith('pm');
    });
    
    it('mcp__dev should call loadRoleDoc with developer role', async () => {
      await mcp__dev({});
      expect(loadRoleDoc).toHaveBeenCalledWith('developer');
    });
    
    it('mcp__reviewer should call loadRoleDoc with reviewer role', async () => {
      await mcp__reviewer({});
      expect(loadRoleDoc).toHaveBeenCalledWith('reviewer');
    });
  });
});