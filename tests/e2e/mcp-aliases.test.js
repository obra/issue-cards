// ABOUTME: End-to-end tests for MCP tool aliases
// ABOUTME: Ensures aliases work correctly through the API

const path = require('path');
const fs = require('fs');
const request = require('supertest');
const axios = require('axios');
const {
  setupTestEnvironment,
  cleanupTestEnvironment,
  runQuietly
} = require('./e2eHelpers');

// Unmock the issueManager to test with real implementation
jest.unmock('../../src/utils/issueManager');

describe('MCP API Aliases E2E', () => {
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
      '## Instructions\nTest instructions 1\n\n' +
      '## Questions to resolve\nExisting question?\n\n' +
      '## Failed approaches\nExisting failed approach\n- Reason: It did not work'
    );
    
    // Set issue 1 as current
    fs.writeFileSync(
      path.join(testDir, '.issues', '.current'),
      '0001'
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
  
  it('should list all tools including aliases via status endpoint', async () => {
    const response = await axios.get(`${baseUrl}/api/status`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('tools');
    expect(response.data.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'mcp__completeTask' }),
        expect.objectContaining({ name: 'mcp__complete' }),
        expect.objectContaining({ name: 'mcp__addTask' }),
        expect.objectContaining({ name: 'mcp__add' }),
        expect.objectContaining({ name: 'mcp__addQuestion' }),
        expect.objectContaining({ name: 'mcp__question' }),
        expect.objectContaining({ name: 'mcp__logFailure' }),
        expect.objectContaining({ name: 'mcp__failure' })
      ])
    );
  });
  
  it('should use mcp__add alias to add a task to an issue', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__add',
      args: {
        issueNumber: '0001',
        description: 'New task from alias test'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        description: 'New task from alias test',
        completed: false,
        issueNumber: '0001'
      })
    );
    
    // Verify the file was actually updated
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0001.md'),
      'utf8'
    );
    
    expect(issueContent).toContain('- [ ] New task from alias test');
  });
  
  it('should use mcp__question alias to add a question to an issue', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__question',
      args: {
        issueNumber: '0001',
        question: 'Is this a new question from alias API'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        issueNumber: '0001',
        questionAdded: true
      })
    );
    
    // Verify the file was actually updated
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0001.md'),
      'utf8'
    );
    
    expect(issueContent).toContain('Is this a new question from alias API?');
  });
  
  it('should use mcp__failure alias to log a failed approach to an issue', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__failure',
      args: {
        issueNumber: '0001',
        approach: 'API alias failure approach',
        reason: 'API alias testing'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        issueNumber: '0001',
        approachLogged: true
      })
    );
    
    // Verify the file was actually updated
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0001.md'),
      'utf8'
    );
    
    expect(issueContent).toContain('API alias failure approach');
    expect(issueContent).toContain('API alias testing');
  });
  
  it('should use mcp__complete alias to complete the current task', async () => {
    // First get the current task
    let response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__getCurrentTask',
      args: {}
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const currentTask = response.data.data.description;
    
    // Now complete the task using the alias
    response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__complete',
      args: {}
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        taskCompleted: currentTask,
        nextTask: expect.objectContaining({
          description: expect.any(String)
        })
      })
    );
    
    // Verify the file was actually updated with the task completed
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0001.md'),
      'utf8'
    );
    
    expect(issueContent).toContain(`- [x] ${currentTask}`);
  });
});