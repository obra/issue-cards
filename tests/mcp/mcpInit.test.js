// ABOUTME: Tests for MCP init tool used for repository initialization
// ABOUTME: Verifies functionality of the mcp__init wrapper

const { mcp__init } = require('../../src/mcp/tools');

// Mock the directory.js utilities
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
  createDirectoryStructure: jest.fn()
}));

// Mock the templateInit.js utilities
jest.mock('../../src/utils/templateInit', () => ({
  copyDefaultTemplates: jest.fn()
}));

// Mock the output manager
jest.mock('../../src/utils/outputManager', () => {
  const originalModule = jest.requireActual('../../src/utils/outputManager');
  return {
    ...originalModule,
    success: jest.fn(),
    error: jest.fn()
  };
});

describe('MCP Init Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should exist as a function', () => {
    expect(typeof mcp__init).toBe('function');
  });
  
  it('should initialize a new repository successfully', async () => {
    // Mock isInitialized to return false (not yet initialized)
    require('../../src/utils/directory').isInitialized.mockResolvedValue(false);
    
    // Mock directory creation and template copy functions to succeed
    require('../../src/utils/directory').createDirectoryStructure.mockResolvedValue(undefined);
    require('../../src/utils/templateInit').copyDefaultTemplates.mockResolvedValue(undefined);
    
    // Call the function and verify the result
    const result = await mcp__init({});
    
    // Check the success response
    expect(result).toEqual({
      success: true,
      data: {
        initialized: true,
        message: expect.stringContaining('Successfully initialized issue tracking')
      }
    });
    
    // Verify the required functions were called
    expect(require('../../src/utils/directory').createDirectoryStructure).toHaveBeenCalled();
    expect(require('../../src/utils/templateInit').copyDefaultTemplates).toHaveBeenCalled();
  });
  
  it('should return already initialized message when repository is already initialized', async () => {
    // Mock isInitialized to return true (already initialized)
    require('../../src/utils/directory').isInitialized.mockResolvedValue(true);
    
    // Call the function and verify the result
    const result = await mcp__init({});
    
    // Check the success response with already initialized message
    expect(result).toEqual({
      success: true,
      data: {
        initialized: false,
        message: expect.stringContaining('already initialized')
      }
    });
    
    // Verify the directory structure and templates were not created
    expect(require('../../src/utils/directory').createDirectoryStructure).not.toHaveBeenCalled();
    expect(require('../../src/utils/templateInit').copyDefaultTemplates).not.toHaveBeenCalled();
  });
  
  it('should handle errors during initialization', async () => {
    // Mock isInitialized to return false
    require('../../src/utils/directory').isInitialized.mockResolvedValue(false);
    
    // Mock directory creation to throw an error
    const errorMessage = 'Failed to create directory structure';
    require('../../src/utils/directory').createDirectoryStructure.mockRejectedValue(new Error(errorMessage));
    
    // Call the function and verify the result
    const result = await mcp__init({});
    
    // Check the error response
    expect(result).toEqual({
      success: false,
      error: {
        type: 'InitError',
        message: expect.stringContaining(errorMessage)
      }
    });
  });
});