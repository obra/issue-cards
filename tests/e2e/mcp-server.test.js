// ABOUTME: End-to-end tests for the MCP server functionality
// ABOUTME: Verifies server startup, API endpoints, and tool execution

const request = require('supertest');

// Mock dependent modules first before requiring server code
jest.mock('../../src/utils/taskParser', () => ({
  parseTaskList: jest.fn().mockReturnValue([]),
  parseTasksWithMetadata: jest.fn().mockReturnValue([])
}));

// Mock taskExpander before requiring any server code
jest.mock('../../src/utils/taskExpander', () => ({
  expandTasks: jest.fn().mockReturnValue([])
}));

// Now we can require the server code
const { startServer, stopServer } = require('../../src/mcp/mcpServer');
const outputManager = require('../../src/utils/outputManager');

// Mock CLI commands
jest.mock('../../src/index', () => ({
  executeCommand: jest.fn()
}));

// Get the mocked executeCommand
const { executeCommand } = require('../../src/index');

// Mock output manager
jest.mock('../../src/utils/outputManager', () => ({
  configure: jest.fn(),
  getCapturedOutput: jest.fn(),
  reset: jest.fn()
}));

// Mock directory access for isInitialized
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn().mockResolvedValue(true)
}));

// Mock MCP tool registration
jest.mock('../../src/mcp/registration', () => ({
  registerMcpTools: jest.fn().mockReturnValue([
    {
      name: 'mcp__listIssues',
      implementation: jest.fn().mockResolvedValue({ success: true, data: [] }),
      description: 'List all available issues',
      parameters: []
    },
    {
      name: 'mcp__showIssue',
      implementation: jest.fn().mockResolvedValue({ success: true, data: {} }),
      description: 'Show details of a specific issue',
      parameters: []
    }
  ]),
  getRegisteredTools: jest.fn().mockReturnValue([
    {
      name: 'mcp__listIssues',
      description: 'List all available issues',
      parameters: []
    },
    {
      name: 'mcp__showIssue',
      description: 'Show details of a specific issue',
      parameters: []
    }
  ])
}));

describe('MCP Server e2e', () => {
  let server;
  
  beforeEach(async () => {
    // Start the server
    try {
      server = await startServer({
        port: 0, // Use random available port
        host: 'localhost',
        token: 'test-token'
      });
    } catch (error) {
      console.error('Failed to start server for test:', error.message);
    }
  });
  
  afterEach(async () => {
    // Stop the server if it exists
    if (server) {
      try {
        await stopServer(server);
      } catch (error) {
        console.error('Error in test cleanup:', error.message);
      }
    }
  });
  
  describe('Health check', () => {
    it('GET /api/health should return 200 OK without authentication', async () => {
      const response = await request(server)
        .get('/api/health');
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
  
  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(server)
        .get('/api/status');
        
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
    
    it('should accept requests with token in header', async () => {
      const response = await request(server)
        .get('/api/status')
        .set('Authorization', 'Bearer test-token');
        
      expect(response.status).toBe(200);
    });
    
    it('should accept requests with token in query param', async () => {
      const response = await request(server)
        .get('/api/status?token=test-token');
        
      expect(response.status).toBe(200);
    });
  });
  
  describe('API endpoints', () => {
    it('GET /api/status should return server status', async () => {
      const response = await request(server)
        .get('/api/status')
        .set('Authorization', 'Bearer test-token');
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
    });
    
    it('GET /api/tools should return available tools', async () => {
      const response = await request(server)
        .get('/api/tools')
        .set('Authorization', 'Bearer test-token');
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
    });
  });
  
  describe('Tool execution', () => {
    beforeEach(() => {
      // Reset and setup mock
      executeCommand.mockReset();
      executeCommand.mockResolvedValue({
        success: true,
        data: { result: 'test-result' }
      });
    });
    
    it('POST /api/tools/execute should execute a tool', async () => {
      const response = await request(server)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__listIssues',
          args: { state: 'open' }
        });
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
    
    it('should validate tool execution requests', async () => {
      const response = await request(server)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          // Missing tool
          args: {}
        });
        
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should validate tool requests with missing args', async () => {
      const response = await request(server)
        .post('/api/tools/execute')
        .set('Authorization', 'Bearer test-token')
        .send({
          tool: 'mcp__listIssues'
          // Missing args, should trigger validation error
        });
        
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});