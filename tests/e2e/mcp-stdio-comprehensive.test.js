// ABOUTME: Comprehensive E2E tests for MCP stdio server
// ABOUTME: Verifies tool execution works correctly over JSON-RPC 2.0 stdio transport

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs').promises;
const os = require('os');

// Helper to run stdio server and exchange messages
function runStdioServer(options = {}) {
  const binPath = path.resolve(__dirname, '../../bin/mcp-stdio-server.js');
  const args = [];
  if (options.debug) args.push('--debug');
  
  // Spawn the process
  const server = spawn('node', [binPath, ...args], {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 5000
  });
  
  // Create readline interface
  const rl = readline.createInterface({
    input: server.stdout,
    output: null
  });
  
  // Store received messages, indexed by id for requests
  const messages = [];
  const responseMap = new Map();
  
  rl.on('line', (line) => {
    try {
      const message = JSON.parse(line);
      messages.push(message);
      
      // Store responses by id for easy lookup
      if (message.id !== undefined && (message.result || message.error)) {
        responseMap.set(message.id, message);
      }
    } catch (err) {
      console.error('Failed to parse JSON from stdio server:', line);
    }
  });
  
  // Capture stderr for debugging
  const stderrChunks = [];
  server.stderr.on('data', (chunk) => {
    stderrChunks.push(chunk);
  });
  
  // Return utilities for interacting with the server
  return {
    sendMessage: (message) => {
      server.stdin.write(JSON.stringify(message) + '\n');
    },
    getMessages: () => [...messages],
    getResponseById: (id) => responseMap.get(id),
    getStderr: () => Buffer.concat(stderrChunks).toString('utf8'),
    waitForResponse: async (id, timeout = 1000) => {
      const startTime = Date.now();
      // Wait until response is available or timeout
      while (!responseMap.has(id) && Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return responseMap.get(id);
    },
    close: () => {
      rl.close();
      server.kill();
    }
  };
}

// Helper to create test issue in a temporary location
async function setupTestIssue() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'issue-cards-test-'));
  const issuesDir = path.join(tmpDir, '.issues');
  const openDir = path.join(issuesDir, 'open');
  
  // Create directory structure
  await fs.mkdir(issuesDir, { recursive: true });
  await fs.mkdir(openDir, { recursive: true });
  
  // Create a test issue
  const issueContent = `# Issue 0001: Test Issue

## Problem to be solved
This is a test problem

## Planned approach
This is the test approach

## Failed approaches

## Questions to resolve

## Tasks
- [ ] Test task 1
- [ ] Test task 2
- [ ] Test task 3

## Instructions
Follow test instructions

## Next steps
`;

  await fs.writeFile(path.join(openDir, 'issue-0001.md'), issueContent);
  
  // Create .current file
  await fs.writeFile(path.join(tmpDir, '.issues', '.current'), '0001');
  
  return tmpDir;
}

// Skip tests if specifically requested
const runOrSkip = process.env.SKIP_MCP_STDIO_COMPREHENSIVE ? describe.skip : describe;

// Comprehensive tests
runOrSkip('MCP Stdio Server - Comprehensive', () => {
  let server;
  let testDir;
  let originalCwd;
  
  beforeAll(async () => {
    // Create test directory and issue
    testDir = await setupTestIssue();
    originalCwd = process.cwd();
    process.chdir(testDir);
  });
  
  afterAll(async () => {
    // Restore working directory
    process.chdir(originalCwd);
    
    // Clean up test directory
    if (testDir) {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Error cleaning up test directory:', err);
      }
    }
  });
  
  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });
  
  test('should support server/info method', async () => {
    server = runStdioServer({ debug: true });
    
    // Give the server time to start up
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send a server/info request
    const requestId = 1;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'server/info'
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(requestId);
    expect(response.result).toHaveProperty('name', 'issue-cards-mcp');
    expect(response.result).toHaveProperty('version');
    expect(response.result).toHaveProperty('capabilities');
    expect(response.result.capabilities).toHaveProperty('tools');
    expect(Array.isArray(response.result.capabilities.tools)).toBe(true);
  });
  
  test('should list issues with mcp__listIssues tool', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send list issues request
    const requestId = 2;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__listIssues',
        args: {
          state: 'open'
        }
      }
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    expect(response.result).toHaveProperty('success', true);
    expect(response.result).toHaveProperty('data');
    expect(Array.isArray(response.result.data)).toBe(true);
    expect(response.result.data.length).toBe(1);
    expect(response.result.data[0]).toHaveProperty('issueNumber', '0001');
    expect(response.result.data[0]).toHaveProperty('title', 'Test Issue');
  });
  
  test('should show issue with mcp__showIssue tool', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send show issue request
    const requestId = 3;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__showIssue',
        args: {
          issueNumber: '0001'
        }
      }
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    // Parse the content field which contains the actual tool response
    const content = response.result.content[0].text;
    const parsedContent = JSON.parse(content);
    
    expect(parsedContent).toHaveProperty('success', true);
    expect(parsedContent).toHaveProperty('data');
    expect(parsedContent.data).toHaveProperty('issueNumber', '0001');
    expect(parsedContent.data).toHaveProperty('title', 'Test Issue');
    expect(parsedContent.data).toHaveProperty('content');
    expect(parsedContent.data.content).toContain('Problem to be solved');
    expect(parsedContent.data.content).toContain('This is a test problem');
  });
  
  test('should get current task with mcp__getCurrentTask tool', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send current task request
    const requestId = 4;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__getCurrentTask',
        args: {}
      }
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    // Parse the content field which contains the actual tool response
    const content = response.result.content[0].text;
    const parsedContent = JSON.parse(content);
    
    expect(parsedContent).toHaveProperty('success', true);
    expect(parsedContent).toHaveProperty('data');
    expect(parsedContent.data).toHaveProperty('issueNumber', '0001');
    expect(parsedContent.data).toHaveProperty('issueTitle', 'Test Issue');
    expect(parsedContent.data).toHaveProperty('taskId');
    expect(parsedContent.data).toHaveProperty('description', 'Test task 1');
  });
  
  test('should add task with mcp__addTask tool', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send add task request
    const requestId = 5;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__addTask',
        args: {
          issueNumber: '0001',
          description: 'New test task'
        }
      }
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    // Parse the content field which contains the actual tool response
    const content = response.result.content[0].text;
    const parsedContent = JSON.parse(content);
    
    expect(parsedContent).toHaveProperty('success', true);
    expect(parsedContent).toHaveProperty('data');
    
    // Verify task was added by getting the issue
    const showRequestId = 6;
    const showRequest = {
      jsonrpc: '2.0',
      id: showRequestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__showIssue',
        args: {
          issueNumber: '0001'
        }
      }
    };
    
    server.sendMessage(showRequest);
    
    // Wait for response
    const showResponse = await server.waitForResponse(showRequestId);
    
    expect(showResponse).toBeDefined();
    // Parse the content field which contains the actual tool response
    const showContent = showResponse.result.content[0].text;
    const parsedShowContent = JSON.parse(showContent);
    
    expect(parsedShowContent).toHaveProperty('success', true);
    expect(parsedShowContent.data.content).toContain('New test task');
  });
  
  test('should complete task with mcp__completeTask tool', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send complete task request
    const requestId = 7;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__completeTask',
        args: {}
      }
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    // Parse the content field which contains the actual tool response
    const content = response.result.content[0].text;
    const parsedContent = JSON.parse(content);
    
    expect(parsedContent).toHaveProperty('success', true);
    expect(parsedContent).toHaveProperty('data');
    expect(parsedContent.data).toHaveProperty('taskCompleted', 'Test task 1');
    expect(parsedContent.data).toHaveProperty('nextTask');
    expect(parsedContent.data.nextTask).toHaveProperty('description', 'Test task 2');
  });
  
  test('should add question with mcp__addQuestion tool', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send add question request
    const requestId = 8;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__addQuestion',
        args: {
          question: 'Test question'
        }
      }
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    // Parse the content field which contains the actual tool response
    const content = response.result.content[0].text;
    const parsedContent = JSON.parse(content);
    
    expect(parsedContent).toHaveProperty('success', true);
    
    // Verify question was added by getting the issue
    const showRequestId = 9;
    const showRequest = {
      jsonrpc: '2.0',
      id: showRequestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__showIssue',
        args: {
          issueNumber: '0001'
        }
      }
    };
    
    server.sendMessage(showRequest);
    
    // Wait for response
    const showResponse = await server.waitForResponse(showRequestId);
    
    expect(showResponse).toBeDefined();
    // Parse the content field which contains the actual tool response
    const showContent = showResponse.result.content[0].text;
    const parsedShowContent = JSON.parse(showContent);
    
    expect(parsedShowContent).toHaveProperty('success', true);
    expect(parsedShowContent.data.content).toContain('Test question?');
  });
  
  test('should handle method not found error', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send invalid method request
    const requestId = 10;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'invalid/method'
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code', -32601);
    expect(response.error).toHaveProperty('message', 'Method not found');
  });
  
  test('should handle tool not found error', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send request for non-existent tool
    const requestId = 11;
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/execute',
      params: {
        tool: 'mcp__nonExistentTool',
        args: {}
      }
    };
    
    server.sendMessage(request);
    
    // Wait for response
    const response = await server.waitForResponse(requestId);
    
    expect(response).toBeDefined();
    // The format varies based on implementation, could be in error or in result with content
    if (response.error) {
      expect(response.error).toBeDefined();
    } else if (response.result && response.result.content) {
      // Parse the content field which contains the actual tool response
      const content = response.result.content[0].text;
      const parsedContent = JSON.parse(content);
      
      expect(parsedContent).toHaveProperty('success', false);
      expect(parsedContent).toHaveProperty('error');
    } else {
      fail('Response should contain either error or result with content field containing error');
    }
  });
});