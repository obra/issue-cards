// ABOUTME: Comprehensive end-to-end tests for MCP tools integration
// ABOUTME: Tests real MCP tools end-to-end with actual command execution

const path = require('path');
const fs = require('fs');
const request = require('supertest');
const axios = require('axios'); // Using axios instead of fetch for testing
const {
  setupTestEnvironment,
  cleanupTestEnvironment,
  runQuietly
} = require('./e2eHelpers');

// Unmock the issueManager to test with real implementation
jest.unmock('../../src/utils/issueManager');

describe('MCP Comprehensive E2E', () => {
  let testDir;
  let serverProcess;
  let serverPort;
  let baseUrl;
  
  // Import directly to create a server programmatically
  const { createServer, startServer, stopServer } = require('../../src/mcp/mcpServer');
  let mcpServer;
  
  beforeAll(async () => {
    // Set up test environment with sample issues
    testDir = setupTestEnvironment();
    
    // Create test issues
    const issueDir = path.join(testDir, '.issues', 'open');
    fs.mkdirSync(issueDir, { recursive: true });
    
    // Create first issue
    fs.writeFileSync(
      path.join(issueDir, 'issue-0001.md'),
      '# Issue 0001: Test Issue 1\n\n' +
      '## Problem to be solved\nTest problem 1\n\n' +
      '## Planned approach\nTest approach 1\n\n' +
      '## Tasks\n- [ ] Task 1.1\n- [x] Task 1.2\n- [ ] Task 1.3\n\n' +
      '## Instructions\nTest instructions 1'
    );
    
    // Create second issue
    fs.writeFileSync(
      path.join(issueDir, 'issue-0002.md'),
      '# Issue 0002: Test Issue 2\n\n' +
      '## Problem to be solved\nTest problem 2\n\n' +
      '## Planned approach\nTest approach 2\n\n' +
      '## Tasks\n- [ ] Task 2.1\n- [ ] Task 2.2\n\n' +
      '## Instructions\nTest instructions 2'
    );
    
    // Set issue 2 as current
    fs.writeFileSync(
      path.join(testDir, '.issues', '.current'),
      '0002'
    );
    
    // Select a random port between 3100-3999 to avoid conflicts
    serverPort = Math.floor(Math.random() * 900) + 3100;
    baseUrl = `http://localhost:${serverPort}`;
    
    // Start the MCP server programmatically
    mcpServer = startServer({
      port: serverPort,
      host: 'localhost',
      token: null // No token for testing
    });
    
    // Give the server time to start
    return new Promise(resolve => setTimeout(resolve, 500));
  });
  
  afterAll(async () => {
    // Stop the server properly
    if (mcpServer && mcpServer.listening) {
      await stopServer(mcpServer);
    }
    
    // Clean up test directory
    cleanupTestEnvironment(testDir);
  });
  
  it('should verify server is running with health check', async () => {
    // Make HTTP request directly
    const response = await axios.get(`${baseUrl}/api/health`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'ok');
  });
  
  it('should list available tools via status endpoint', async () => {
    const response = await axios.get(`${baseUrl}/api/status`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('tools');
    expect(response.data.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'mcp__listIssues' }),
        expect.objectContaining({ name: 'mcp__showIssue' }),
        expect.objectContaining({ name: 'mcp__getCurrentTask' }),
        expect.objectContaining({ name: 'mcp__addTask' })
      ])
    );
  });
  
  it('should list issues via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__listIssues',
      args: { state: 'open' }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveLength(2);
    expect(response.data.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          number: '0001',
          title: 'Test Issue 1'
        }),
        expect.objectContaining({
          number: '0002',
          title: 'Test Issue 2'
        })
      ])
    );
  });
  
  it('should show issue details via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__showIssue',
      args: { issueNumber: '0001' }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        number: '0001',
        title: 'Test Issue 1',
        content: expect.stringContaining('Test problem 1')
      })
    );
  });
  
  it('should get current task via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__getCurrentTask',
      args: {}
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        issueNumber: '0002',
        issueTitle: 'Test Issue 2',
        description: 'Task 2.1',
        context: expect.objectContaining({
          problem: 'Test problem 2',
          approach: 'Test approach 2',
          instructions: 'Test instructions 2'
        })
      })
    );
  });
  
  it('should add a task to an issue via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addTask',
      args: {
        issueNumber: '0001',
        description: 'New task from E2E test'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        description: 'New task from E2E test',
        completed: false,
        issueNumber: '0001'
      })
    );
    
    // Verify the file was actually updated
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0001.md'),
      'utf8'
    );
    
    expect(issueContent).toContain('- [ ] New task from E2E test');
  });
  
  it('should handle validation errors', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addTask',
      args: {
        issueNumber: '0001',
        description: '' // Empty description should fail validation
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(false);
    expect(response.data.error).toHaveProperty('type', 'ValidationError');
  });
  
  it('should handle not found errors', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__showIssue',
      args: {
        issueNumber: '9999' // Non-existent issue
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(false);
    expect(response.data.error).toHaveProperty('type', 'NotFoundError');
  });
});