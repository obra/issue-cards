// ABOUTME: Integration test for onboarding tools via stdio server
// ABOUTME: Verifies onboarding tools work correctly through MCP transport

const { mcp__onboarding, mcp__workflow, mcp__dev } = require('../../src/mcp/onboardingTools');
const { withValidation } = require('../../src/mcp/validator');
const { executeToolRequest } = require('../../src/mcp/registration');

// Mock dependencies
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

// Mock Express request/response objects
const mockRequest = (tool, args) => ({
  body: { tool, args },
  resolvedTool: {
    name: tool,
    implementation: tool === 'mcp__onboarding' ? mcp__onboarding :
                    tool === 'mcp__workflow' ? mcp__workflow :
                    tool === 'mcp__dev' ? mcp__dev : null
  }
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Onboarding tools via MCP server', () => {
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
  
  it('should process mcp__onboarding request via executeToolRequest', async () => {
    const req = mockRequest('mcp__onboarding', { role: 'pm' });
    const res = mockResponse();
    
    await executeToolRequest(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    expect(responseData.data.title).toBe('Project Manager Onboarding');
    expect(loadRoleDoc).toHaveBeenCalledWith('pm');
  });
  
  it('should process mcp__dev request via executeToolRequest', async () => {
    const req = mockRequest('mcp__dev', {});
    const res = mockResponse();
    
    await executeToolRequest(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    expect(responseData.data.title).toBe('Developer Onboarding');
    expect(loadRoleDoc).toHaveBeenCalledWith('developer');
  });
  
  it('should process mcp__workflow request via executeToolRequest', async () => {
    const req = mockRequest('mcp__workflow', {});
    const res = mockResponse();
    
    await executeToolRequest(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    expect(responseData.data.title).toBe('Available Workflows');
    expect(listWorkflows).toHaveBeenCalled();
  });
});