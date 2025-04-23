// ABOUTME: Tests for initialization check in onboarding process
// ABOUTME: Verifies onboarding correctly detects uninitialized repositories

const { mcp__onboarding } = require('../../src/mcp/onboardingTools');

// Mock the documentationParser
jest.mock('../../src/utils/documentationParser', () => ({
  loadRoleDoc: jest.fn(),
  loadWorkflowDoc: jest.fn(),
  listWorkflows: jest.fn()
}));

// Mock the directory utilities
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn()
}));

// Import the mocks to control them
const { loadRoleDoc } = require('../../src/utils/documentationParser');
const { isInitialized } = require('../../src/utils/directory');

describe('Onboarding Init Check', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation for loadRoleDoc
    loadRoleDoc.mockImplementation((role) => {
      return {
        title: 'Project Manager Onboarding',
        description: 'PM description',
        workflows: ['[Create Feature](../workflows/create-feature.md)'],
        bestPractices: ['Practice 1'],
        toolExamples: []
      };
    });
  });
  
  it('should include initialization status when repository is initialized', async () => {
    // Mock isInitialized to return true
    isInitialized.mockResolvedValue(true);
    
    const result = await mcp__onboarding({ role: 'pm' });
    
    expect(result.success).toBe(true);
    expect(result.data.isInitialized).toBe(true);
    expect(result.data.initMessage).toBeUndefined();
    
    // Check that both isInitialized and loadRoleDoc were called
    expect(isInitialized).toHaveBeenCalled();
    expect(loadRoleDoc).toHaveBeenCalledWith('pm');
  });
  
  it('should include initialization warning when repository is not initialized', async () => {
    // Mock isInitialized to return false
    isInitialized.mockResolvedValue(false);
    
    const result = await mcp__onboarding({ role: 'pm' });
    
    expect(result.success).toBe(true);
    expect(result.data.isInitialized).toBe(false);
    expect(result.data.initMessage).toEqual(expect.stringContaining('not initialized'));
    expect(result.data.initMessage).toEqual(expect.stringContaining('mcp__init'));
    
    // Check that both isInitialized and loadRoleDoc were called
    expect(isInitialized).toHaveBeenCalled();
    expect(loadRoleDoc).toHaveBeenCalledWith('pm');
  });
  
  it('should handle errors from isInitialized check', async () => {
    // Mock isInitialized to throw an error
    isInitialized.mockRejectedValue(new Error('Failed to check initialization status'));
    
    const result = await mcp__onboarding({ role: 'pm' });
    
    // Should still return onboarding data but with unknown initialization status
    expect(result.success).toBe(true);
    expect(result.data.isInitialized).toBeUndefined();
    expect(result.data.initMessage).toEqual(expect.stringContaining('Unable to check'));
    
    // LoadRoleDoc should still be called to get onboarding data
    expect(loadRoleDoc).toHaveBeenCalledWith('pm');
  });
});