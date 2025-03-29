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
    { number: '0001', title: 'Test Issue', state: 'open', tasks: [] }
  ]),
  getIssueByNumber: jest.fn().mockImplementation(async (number) => {
    if (number === '0001') {
      return { 
        number: '0001', 
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
  getCurrentIssue: jest.fn().mockResolvedValue({ number: '0001', title: 'Current Issue' }),
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
  let serverProcess;
  const serverPort = 3002;
  
  beforeEach(async () => {
    // Set up test environment with sample issues
    testDir = setupTestEnvironment();
    
    // Create the Express app for direct testing
    app = createServer({ token: 'test-token' });
    
    // Start the server for API testing
    server = startServer({
      port: serverPort,
      host: 'localhost', 
      token: 'test-token'
    });
  });
  
  afterEach(async () => {
    // Clean up
    await stopServer(server);
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
      // Run the serve command with --help to verify it works
      const result = runQuietly('node ../../bin/issue-cards.js serve --help');
      expect(result.stdout).toContain('Start the MCP server for AI integration');
      expect(result.status).toBe(0);
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
      // Request list of issues through API
      const response = await request(app)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__listIssues',
          args: { state: 'open' }
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            number: '0001',
            title: expect.stringContaining('Test Issue')
          })
        ])
      });
    });
    
    it('should validate arguments', async () => {
      // Request with invalid arguments
      const response = await request(app)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__listIssues',
          args: { state: 'invalid-state' }
        });
      
      // Verify validation error
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
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
      // Request issue details through API
      const response = await request(app)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__showIssue',
          args: { issueNumber: '0001' }
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          number: '0001',
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
      // Request non-existent issue
      const response = await request(app)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__showIssue',
          args: { issueNumber: '9999' }
        });
      
      // Verify not found error
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
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
      // Request current task through API
      const response = await request(app)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__getCurrentTask',
          args: {}
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
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
      
      // Request current task through API
      const response = await request(app)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__getCurrentTask',
          args: {}
        });
      
      // Verify null response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
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
      // Request to add a task
      const response = await request(app)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__addTask',
          args: {
            issueNumber: '0001',
            description: 'New task from API'
          }
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
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
      // Request with missing description
      const response = await request(app)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__addTask',
          args: {
            issueNumber: '0001',
            description: ''
          }
        });
      
      // Verify validation error
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'ValidationError'
        })
      });
    });
  });
});