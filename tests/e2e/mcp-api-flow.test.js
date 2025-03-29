// ABOUTME: End-to-end tests for MCP API full workflow
// ABOUTME: Tests complete MCP API workflows like issue management

const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Using axios instead of fetch
const {
  setupTestEnvironment,
  cleanupTestEnvironment,
  runQuietly
} = require('./e2eHelpers');

// Unmock the issueManager to test with real implementation
jest.unmock('../../src/utils/issueManager');

describe('MCP API Workflow', () => {
  let testDir;
  let serverPort;
  let baseUrl;
  
  // Import directly to create a server programmatically
  const { createServer, startServer, stopServer } = require('../../src/mcp/mcpServer');
  let mcpServer;
  
  beforeAll(async () => {
    // Set up test environment with sample issues
    testDir = setupTestEnvironment();
    
    // Create basic issue structure
    const issueDir = path.join(testDir, '.issues', 'open');
    fs.mkdirSync(issueDir, { recursive: true });
    
    // Create issue
    fs.writeFileSync(
      path.join(issueDir, 'issue-0001.md'),
      '# Issue 0001: Task Management Workflow\n\n' +
      '## Problem to be solved\nTest complex workflows\n\n' +
      '## Planned approach\nUse MCP API to manage tasks\n\n' +
      '## Tasks\n- [ ] Initial task\n\n' +
      '## Instructions\nTest API workflow management'
    );
    
    // Set as current issue
    fs.writeFileSync(
      path.join(testDir, '.issues', '.current'),
      '0001'
    );
    
    // Select a random port between 4100-4999 to avoid conflicts with other tests
    serverPort = Math.floor(Math.random() * 900) + 4100;
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
  
  it('should support a complete task management workflow', async () => {
    // Step 1: Get current task
    let response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__getCurrentTask',
      args: {}
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.data.success).toBe(true);
    expect(response.data.data.description).toBe('Initial task');
    
    // Step 2: Add multiple tasks to the issue
    response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addTask',
      args: {
        issueNumber: '0001',
        description: 'First workflow task'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.data.success).toBe(true);
    
    response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addTask',
      args: {
        issueNumber: '0001',
        description: 'Second workflow task'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.data.success).toBe(true);
    
    // Step 3: Show the issue to verify tasks were added
    response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__showIssue',
      args: {
        issueNumber: '0001'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.data.success).toBe(true);
    
    // Verify all tasks are present in the issue content
    expect(response.data.data.content).toContain('- [ ] Initial task');
    expect(response.data.data.content).toContain('- [ ] First workflow task');
    expect(response.data.data.content).toContain('- [ ] Second workflow task');
    
    // Final check on the filesystem to make sure changes were persisted
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0001.md'),
      'utf8'
    );
    
    expect(issueContent).toContain('- [ ] Initial task');
    expect(issueContent).toContain('- [ ] First workflow task');
    expect(issueContent).toContain('- [ ] Second workflow task');
  });
  
  it('should validate issue existence across tools', async () => {
    // Try to add task to non-existent issue
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addTask',
      args: {
        issueNumber: '9999',
        description: 'Task for non-existent issue'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.data.success).toBe(false);
    expect(response.data.error.type).toBe('NotFoundError');
    expect(response.data.error.message).toContain('Issue #9999 not found');
  });
  
  it('should validate parameter types', async () => {
    // Try to add task with invalid issueNumber type
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addTask',
      args: {
        issueNumber: 123, // Number instead of string
        description: 'Task with invalid issue number type'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.data.success).toBe(false);
    expect(response.data.error.type).toBe('ValidationError');
  });
});