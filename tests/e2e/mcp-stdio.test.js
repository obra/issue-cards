// ABOUTME: E2E tests for MCP stdio server implementation
// ABOUTME: Verifies stdio JSON-RPC 2.0 communication

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

// Helper to run stdio server and exchange messages
const runStdioServer = (options = {}) => {
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
  
  // Store received messages
  const messages = [];
  rl.on('line', (line) => {
    try {
      const message = JSON.parse(line);
      messages.push(message);
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
    getStderr: () => Buffer.concat(stderrChunks).toString('utf8'),
    close: () => {
      rl.close();
      server.kill();
    }
  };
};

// Skip tests if project is not initialized - this is just an integration test
const runOrSkip = process.env.SKIP_MCP_STDIO_TESTS ? describe.skip : describe;

// Integration tests
runOrSkip('MCP Stdio Server', () => {
  let server;
  
  afterEach(() => {
    if (server) {
      server.close();
      server = null;
    }
  });
  
  test('should receive server/info notification on startup', async () => {
    // This test is async since we need to wait for messages to be received
    server = runStdioServer({ debug: true });
    
    // Give the server time to start up and send initial messages
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check that we received the server/info notification
    const messages = server.getMessages();
    expect(messages.length).toBeGreaterThan(0);
    
    const serverInfo = messages.find(msg => 
      msg.jsonrpc === '2.0' && 
      msg.method === 'server/info'
    );
    
    expect(serverInfo).toBeDefined();
    expect(serverInfo.params).toHaveProperty('name', 'issue-cards-mcp');
    expect(serverInfo.params).toHaveProperty('version');
    expect(serverInfo.params).toHaveProperty('capabilities');
    expect(serverInfo.params.capabilities).toHaveProperty('tools');
    expect(Array.isArray(serverInfo.params.capabilities.tools)).toBe(true);
  });
  
  test('should respond to server/info request', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send a server/info request
    const request = {
      jsonrpc: '2.0',
      id: 123,
      method: 'server/info'
    };
    
    server.sendMessage(request);
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for response
    const messages = server.getMessages();
    const response = messages.find(msg => 
      msg.jsonrpc === '2.0' && 
      msg.id === 123 &&
      msg.result
    );
    
    expect(response).toBeDefined();
    expect(response.result).toHaveProperty('name', 'issue-cards-mcp');
    expect(response.result).toHaveProperty('capabilities');
    expect(response.result.capabilities).toHaveProperty('tools');
  });
  
  test('should respond to client/ready notification', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send a client/ready notification
    const notification = {
      jsonrpc: '2.0',
      method: 'client/ready'
    };
    
    server.sendMessage(notification);
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for server/ready notification
    const messages = server.getMessages();
    const serverReady = messages.find(msg => 
      msg.jsonrpc === '2.0' && 
      msg.method === 'server/ready'
    );
    
    expect(serverReady).toBeDefined();
    expect(serverReady.params).toHaveProperty('capabilities');
    expect(serverReady.params.capabilities).toHaveProperty('tools');
  });
  
  test('should return proper error for unknown method', async () => {
    server = runStdioServer();
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send a request with unknown method
    const request = {
      jsonrpc: '2.0',
      id: 456,
      method: 'unknown/method'
    };
    
    server.sendMessage(request);
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for error response
    const messages = server.getMessages();
    const errorResponse = messages.find(msg => 
      msg.jsonrpc === '2.0' && 
      msg.id === 456 &&
      msg.error
    );
    
    expect(errorResponse).toBeDefined();
    expect(errorResponse.error).toHaveProperty('code', -32601); // Method not found
    expect(errorResponse.error).toHaveProperty('message', 'Method not found');
  });
});