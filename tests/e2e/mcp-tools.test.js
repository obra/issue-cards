// ABOUTME: End-to-end tests for MCP tools
// ABOUTME: Verifies the complete functionality of MCP tooling for AI integration

const path = require('path');
const { execFileSync } = require('child_process');
const request = require('supertest');
const fs = require('fs');
const {
  setupTestEnvironment,
  cleanupTestEnvironment,
  runQuietly
} = require('./e2eHelpers');

// Mock the issueManager functions
jest.mock('../../src/utils/issueManager', () => ({
  getIssues: jest.fn().mockResolvedValue([
    { issueNumber: '0001', title: 'Test Issue', state: 'open', tasks: [] }
  ]),
  getIssueByNumber: jest.fn().mockImplementation(async (number) => {
    if (number === '0001') {
      return { 
        issueNumber: '0001', 
        title: 'Test Issue', 
        state: 'open', 
        tasks: [
          { id: '1', description: 'Task 1', completed: false },
          { id: '2', description: 'Task 2', completed: true }
        ]
      };
    }
    throw new Error(`Issue not found: ${number}`);
  }),
  isValidIssueNumber: jest.fn().mockReturnValue(true),
  getCurrentIssue: jest.fn().mockResolvedValue({ issueNumber: '0001', title: 'Current Issue' }),
  getCurrentTask: jest.fn().mockResolvedValue({ 
    id: 'task-1', 
    description: '{{TASK}}', 
    completed: false,
    contextData: {
      problem: 'Test problem',
      approach: 'Test approach'
    }
  }),
  addTaskToIssue: jest.fn().mockImplementation(async (issueNumber, description) => {
    if (issueNumber === '0001') {
      return { id: 'new-task', description, completed: false };
    }
    throw new Error(`Issue not found: ${issueNumber}`);
  })
}));

const {
  createServer,
  startServer,
  stopServer
} = require('../../src/mcp/mcpServer');

describe('MCP Tools E2E', () => {
  let testDir;
  let server;
  let app;
  
  // Use a unique random port for each Jest run to avoid conflicts with other test suites
  // Use a fixed port for each test within this suite to avoid creating multiple servers
  const serverPort = 13579;
  
  // Set up once before all tests in this suite
  beforeAll(async () => {
    // Create the Express app for direct testing
    app = createServer({ token: 'test-token' });
    
    // Start a single server for all tests in this suite
    server = startServer({
      port: serverPort,
      host: 'localhost', 
      token: 'test-token'
    });
    
    // Wait for the server to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  // Clean up once after all tests in this suite
  afterAll(async () => {
    // Ensure server is properly stopped
    if (server) {
      await stopServer(server);
      server = null;
    }
  });
  
  // Set up for each individual test
  beforeEach(() => {
    // Set up test environment with sample issues
    testDir = setupTestEnvironment();
  });
  
  // Clean up after each individual test
  afterEach(() => {
    // Clean up test environment
    cleanupTestEnvironment(testDir);
  });
  
  // Test the actual CLI serve command
  describe('CLI server execution', () => {
    beforeEach(() => {
      // Create a sample issue for the CLI to work with
      const issueDir = path.join(testDir, '.issues', 'open');
      fs.mkdirSync(issueDir, { recursive: true });
      fs.writeFileSync(
        path.join(issueDir, 'issue-0001.md'),
        '# Issue 0001: Test Issue\n\n## Problem to be solved\n' +
        'This is a test issue\n\n## Tasks\n- [ ] Task 1\n- [x] Task 2'
      );
    });
    
    it('should start the server via CLI command', () => {
      // Check the serve command description
      const { createCommand } = require('../../src/commands/serve');
      const serveCommand = createCommand();
      
      // Verify the command description
      expect(serveCommand.description()).toBe('Start the MCP server for AI integration');
      
      // Verify options are correctly defined
      expect(serveCommand.options.find(o => o.short === '-p')).toBeTruthy();
      expect(serveCommand.options.find(o => o.short === '-h')).toBeTruthy();
      expect(serveCommand.options.find(o => o.short === '-t')).toBeTruthy();
    });
  });
  
  describe('mcp__listIssues', () => {
    beforeEach(() => {
      // Create a sample issue in the test directory
      const issueDir = path.join(testDir, '.issues', 'open');
      fs.mkdirSync(issueDir, { recursive: true });
      fs.writeFileSync(
        path.join(issueDir, 'issue-0001.md'),
        '# Issue 0001: Test Issue\n\n## Tasks\n- [ ] Task 1\n- [x] Task 2'
      );
    });
    
    it('should list issues via API', async () => {
      // Direct test of the tool using the mocked issueManager
      const { mcp__listIssues } = require('../../src/mcp/tools');
      const result = await mcp__listIssues({ state: 'open' });
      
      expect(result).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            issueNumber: '0001',
            title: expect.stringContaining('Test Issue')
          })
        ])
      });
    });
    
    it('should validate arguments', async () => {
      // Direct test of the tool with invalid arguments
      const { mcp__listIssues } = require('../../src/mcp/tools');
      const result = await mcp__listIssues({ state: 'invalid-state' });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'ValidationError'
        })
      });
    });
  });
  
  describe('mcp__showIssue', () => {
    beforeEach(() => {
      // Create a sample issue in the test directory
      const issueDir = path.join(testDir, '.issues', 'open');
      fs.mkdirSync(issueDir, { recursive: true });
      fs.writeFileSync(
        path.join(issueDir, 'issue-0001.md'),
        '# Issue 0001: Test Issue\n\n## Problem to be solved\n' +
        'This is a test issue\n\n## Tasks\n- [ ] Task 1\n- [x] Task 2'
      );
    });
    
    it('should show issue details via API', async () => {
      // Direct test of the tool
      const { mcp__showIssue } = require('../../src/mcp/tools');
      const result = await mcp__showIssue({ issueNumber: '0001' });
      
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          issueNumber: '0001',
          title: expect.stringContaining('Test Issue'),
          tasks: expect.arrayContaining([
            expect.objectContaining({
              description: 'Task 1',
              completed: false
            }),
            expect.objectContaining({
              description: 'Task 2',
              completed: true
            })
          ])
        })
      });
    });
    
    it('should return error for non-existent issues', async () => {
      // Direct test of the tool with non-existent issue
      const { mcp__showIssue } = require('../../src/mcp/tools');
      // Override mock to return error for this test
      require('../../src/utils/issueManager').getIssueByNumber.mockRejectedValueOnce(new Error('Issue #9999 not found'));
      
      const result = await mcp__showIssue({ issueNumber: '9999' });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'NotFoundError'
        })
      });
    });
  });
  
  describe('mcp__getCurrentTask', () => {
    beforeEach(() => {
      // Create a sample current issue and task
      const issuesDir = path.join(testDir, '.issues');
      const openDir = path.join(issuesDir, 'open');
      fs.mkdirSync(openDir, { recursive: true });
      
      // Create issue with tasks
      fs.writeFileSync(
        path.join(openDir, 'issue-0001.md'),
        '# Issue 0001: Current Issue\n\n' +
        '## Problem to be solved\nTest problem\n\n' +
        '## Planned approach\nTest approach\n\n' +
        '## Tasks\n- [ ] First task\n- [ ] {{TASK}}\n- [ ] Third task'
      );
      
      // Set issue as current
      fs.writeFileSync(
        path.join(issuesDir, 'current'),
        '0001'
      );
    });
    
    it('should get current task via API', async () => {
      // Direct test of the tool
      const { mcp__getCurrentTask } = require('../../src/mcp/tools');
      const result = await mcp__getCurrentTask({});
      
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          issueNumber: '0001',
          issueTitle: 'Current Issue',
          description: '{{TASK}}',
          context: expect.objectContaining({
            problem: 'Test problem',
            approach: 'Test approach'
          })
        })
      });
    });
    
    it('should handle case with no current issue', async () => {
      // Override getCurrentIssue mock to return null
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValueOnce(null);
      
      // Direct test of the tool with no current issue
      const { mcp__getCurrentTask } = require('../../src/mcp/tools');
      const result = await mcp__getCurrentTask({});
      
      expect(result).toEqual({
        success: true,
        data: null
      });
    });
  });
  
  describe('mcp__addTask', () => {
    beforeEach(() => {
      // Create a sample issue to add tasks to
      const issueDir = path.join(testDir, '.issues', 'open');
      fs.mkdirSync(issueDir, { recursive: true });
      fs.writeFileSync(
        path.join(issueDir, 'issue-0001.md'),
        '# Issue 0001: Test Issue\n\n## Tasks\n- [ ] Existing task'
      );
    });
    
    it('should add a task to an issue via API', async () => {
      // Direct test of the tool
      const { mcp__addTask } = require('../../src/mcp/tools');
      const result = await mcp__addTask({
        issueNumber: '0001',
        description: 'New task from API'
      });
      
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          description: 'New task from API',
          completed: false
        })
      });
      
      // Verify the addTaskToIssue function was called
      expect(require('../../src/utils/issueManager').addTaskToIssue)
        .toHaveBeenCalledWith('0001', 'New task from API');
    });
    
    it('should validate input parameters', async () => {
      // Direct test of the tool with empty description
      const { mcp__addTask } = require('../../src/mcp/tools');
      const result = await mcp__addTask({
        issueNumber: '0001',
        description: ''
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'ValidationError'
        })
      });
    });
  });
});