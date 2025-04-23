// ABOUTME: Integration test for onboarding MCP tools
// ABOUTME: Directly tests the implementation without the stdio server

const { mcp__onboarding, mcp__workflow, mcp__dev } = require('../../src/mcp/onboardingTools');

// Mock documentationParser
jest.mock('../../src/utils/documentationParser', () => ({
  loadRoleDoc: jest.fn(),
  loadWorkflowDoc: jest.fn(),
  listWorkflows: jest.fn()
}));

// Import mocks
const {
  loadRoleDoc,
  loadWorkflowDoc,
  listWorkflows
} = require('../../src/utils/documentationParser');

describe('Onboarding MCP tools integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock data
    loadRoleDoc.mockImplementation((role) => {
      if (role === 'pm') {
        return {
          title: 'Project Manager Onboarding',
          description: 'PM description',
          workflows: ['[Create Feature](../workflows/create-feature.md)'],
          bestPractices: ['Practice 1']
        };
      } else if (role === 'developer') {
        return {
          title: 'Developer Onboarding',
          description: 'Developer description',
          workflows: ['[Task Management](../workflows/task-management.md)'],
          bestPractices: ['Practice 2']
        };
      } else {
        throw new Error(`Unknown role: ${role}`);
      }
    });
    
    listWorkflows.mockReturnValue([
      { id: 'create-feature', title: 'Create Feature' }
    ]);
  });
  
  it('should return PM onboarding information', async () => {
    const result = await mcp__onboarding({ role: 'pm' });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.title).toBe('Project Manager Onboarding');
    expect(loadRoleDoc).toHaveBeenCalledWith('pm');
  });
  
  it('should return dev onboarding information via alias', async () => {
    const result = await mcp__dev({});
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.title).toBe('Developer Onboarding');
    expect(loadRoleDoc).toHaveBeenCalledWith('developer');
  });
  
  it('should return workflow information', async () => {
    const result = await mcp__workflow({});
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.title).toBe('Available Workflows');
    expect(listWorkflows).toHaveBeenCalled();
  });
});