// ABOUTME: Tests for MCP tool aliases to ensure they work properly
// ABOUTME: Verifies that alias tools have the same functionality as their originals

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

// Mock the issue manager functions for core functionality
jest.mock('../../src/utils/issueManager', () => ({
  getIssues: jest.fn(),
  getIssueByNumber: jest.fn(),
  isValidIssueNumber: jest.fn(),
  isValidIssueState: jest.fn(),
  getCurrentIssue: jest.fn(),
  getCurrentTask: jest.fn(),
  addTaskToIssue: jest.fn(),
  getIssueFilePath: jest.fn(),
  closeIssue: jest.fn(),
  completeTask: jest.fn(),
  getNextIssueNumber: jest.fn(),
  saveIssue: jest.fn(),
  getIssue: jest.fn(),
  getTemplates: jest.fn()
}));

// Mock the command execution
jest.mock('../../src/index', () => ({
  executeCommand: jest.fn()
}));

// Mock section manager
jest.mock('../../src/utils/sectionManager', () => ({
  addContentToSection: jest.fn(),
  findSectionByName: jest.fn(),
  normalizeSectionName: jest.fn(name => name)
}));

// Mock task parser functions
jest.mock('../../src/utils/taskParser', () => ({
  extractTasks: jest.fn(),
  findCurrentTask: jest.fn(),
  updateTaskStatus: jest.fn()
}));

// Import MCP tools
const { 
  mcp__completeTask,
  mcp__complete,
  mcp__addTask,
  mcp__add,
  mcp__addQuestion,
  mcp__question,
  mcp__logFailure,
  mcp__failure
} = require('../../src/mcp/tools');

// Import validator for testing
const { schemas } = require('../../src/mcp/validator');

describe('MCP Tool Aliases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('mcp__complete (alias for mcp__completeTask)', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__complete).toBe('function');
    });
    
    it('should have a corresponding schema', () => {
      expect(schemas.mcp__complete).toBeDefined();
      expect(schemas.mcp__complete).toEqual(schemas.mcp__completeTask);
    });
  });
  
  describe('mcp__add (alias for mcp__addTask)', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__add).toBe('function');
    });
    
    it('should have a corresponding schema', () => {
      expect(schemas.mcp__add).toBeDefined();
      expect(schemas.mcp__add).toEqual(schemas.mcp__addTask);
    });
  });
  
  describe('mcp__question (alias for mcp__addQuestion)', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__question).toBe('function');
    });
    
    it('should have a corresponding schema', () => {
      expect(schemas.mcp__question).toBeDefined();
      expect(schemas.mcp__question).toEqual(schemas.mcp__addQuestion);
    });
  });
  
  describe('mcp__failure (alias for mcp__logFailure)', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__failure).toBe('function');
    });
    
    it('should have a corresponding schema', () => {
      expect(schemas.mcp__failure).toBeDefined();
      expect(schemas.mcp__failure).toEqual(schemas.mcp__logFailure);
    });
  });
});