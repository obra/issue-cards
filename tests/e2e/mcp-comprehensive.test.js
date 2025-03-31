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
      '## Instructions\nTest instructions 1\n\n' +
      '## Questions to resolve\nExisting question?\n\n' +
      '## Failed approaches\nExisting failed approach\n- Reason: It did not work'
    );
    
    // Create second issue
    fs.writeFileSync(
      path.join(issueDir, 'issue-0002.md'),
      '# Issue 0002: Test Issue 2\n\n' +
      '## Problem to be solved\nTest problem 2\n\n' +
      '## Planned approach\nTest approach 2\n\n' +
      '## Tasks\n- [ ] Task 2.1\n- [ ] Task 2.2\n\n' +
      '## Instructions\nTest instructions 2\n\n' +
      '## Questions to resolve\n\n' +
      '## Failed approaches\n'
    );
    
    // Set issue 2 as current
    fs.writeFileSync(
      path.join(testDir, '.issues', '.current'),
      '0002'
    );
    
    // Copy template files to the correct directory structure recognized by issue-cards
    const configDir = path.join(testDir, '.issues', 'config');
    const issueTemplateDir = path.join(configDir, 'templates', 'issue');
    const tagTemplateDir = path.join(configDir, 'templates', 'tag');
    
    // These directories should already exist from setupTestEnvironment
    
    // Create sample templates
    fs.writeFileSync(
      path.join(issueTemplateDir, 'test.md'),
      '# Issue {{NUMBER}}: {{TITLE}}\n\n' +
      '## Problem to be solved\n{{PROBLEM}}\n\n' +
      '## Planned approach\n{{APPROACH}}\n\n' +
      '## Tasks\n{{TASKS}}\n\n' +
      '## Instructions\n{{INSTRUCTIONS}}\n\n' +
      '## Questions to resolve\n{{QUESTIONS}}\n\n' +
      '## Failed approaches\n{{FAILED_APPROACHES}}'
    );
    
    fs.writeFileSync(
      path.join(tagTemplateDir, 'test-tag.md'),
      '## Test Tag\n\nThis is a test tag template.'
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
        expect.objectContaining({ name: 'mcp__addTask' }),
        expect.objectContaining({ name: 'mcp__createIssue' }),
        expect.objectContaining({ name: 'mcp__completeTask' }),
        expect.objectContaining({ name: 'mcp__addNote' }),
        expect.objectContaining({ name: 'mcp__addQuestion' }),
        expect.objectContaining({ name: 'mcp__logFailure' }),
        expect.objectContaining({ name: 'mcp__listTemplates' }),
        expect.objectContaining({ name: 'mcp__showTemplate' })
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
          issueNumber: '0001',
          title: 'Test Issue 1'
        }),
        expect.objectContaining({
          issueNumber: '0002',
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
        issueNumber: '0001',
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
        taskId: expect.any(String),
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
  
  it('should create a new issue via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__createIssue',
      args: {
        template: 'test',
        title: 'New API Issue',
        problem: 'API created issue',
        approach: 'Use MCP API',
        task: ['First API task', 'Second API task']
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        title: 'New API Issue',
        template: 'test'
      })
    );
    
    // Verify the file was actually created
    const newIssueNumber = response.data.data.issueNumber;
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', `issue-${newIssueNumber}.md`),
      'utf8'
    );
    
    expect(issueContent).toContain('# Issue');
    expect(issueContent).toContain('New API Issue');
    expect(issueContent).toContain('API created issue');
    expect(issueContent).toContain('Use MCP API');
    expect(issueContent).toContain('- [ ] First API task');
    expect(issueContent).toContain('- [ ] Second API task');
  });
  
  it('should complete a task via API', async () => {
    // First get the current task
    let response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__getCurrentTask',
      args: {}
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const currentTask = response.data.data.description;
    
    // Now complete the task
    response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__completeTask',
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
          description: 'Task 2.2'
        })
      })
    );
    
    // Verify the file was actually updated
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0002.md'),
      'utf8'
    );
    
    expect(issueContent).toContain('- [x] Task 2.1');
    expect(issueContent).toContain('- [ ] Task 2.2');
  });
  
  it('should add a note to an issue section via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addNote',
      args: {
        issueNumber: '0001',
        section: 'Problem to be solved',
        note: 'Additional problem information from API'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        issueNumber: '0001',
        section: 'Problem to be solved',
        noteAdded: true
      })
    );
    
    // Verify the file was actually updated
    const issueContent = fs.readFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0001.md'),
      'utf8'
    );
    
    expect(issueContent).toContain('Additional problem information from API');
  });
  
  it('should add a question to an issue via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addQuestion',
      args: {
        issueNumber: '0001',
        question: 'Is this a new question from API'
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
    
    expect(issueContent).toContain('Is this a new question from API?');
  });
  
  it('should log a failed approach to an issue via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__logFailure',
      args: {
        issueNumber: '0001',
        approach: 'API failure approach',
        reason: 'API testing'
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
    
    expect(issueContent).toContain('API failure approach');
    expect(issueContent).toContain('API testing');
  });
  
  it('should list templates via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__listTemplates',
      args: {}
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('issue');
    expect(response.data.data).toHaveProperty('tag');
    expect(response.data.data.issue).toContain('test');
    expect(response.data.data.tag).toContain('test-tag');
  });
  
  it('should show a template via API', async () => {
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__showTemplate',
      args: {
        type: 'issue',
        name: 'test'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toEqual(
      expect.objectContaining({
        name: 'test',
        type: 'issue',
        content: expect.stringContaining('# Issue {{NUMBER}}: {{TITLE}}')
      })
    );
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
  
  it('should handle section not found errors', async () => {
    // Create an issue without Questions section
    fs.writeFileSync(
      path.join(testDir, '.issues', 'open', 'issue-0003.md'),
      '# Issue 0003: Missing Section\n\n' +
      '## Problem to be solved\nTest problem\n\n' +
      '## Tasks\n- [ ] Test task\n\n'
    );
    
    const response = await axios.post(`${baseUrl}/api/tools/execute`, {
      tool: 'mcp__addQuestion',
      args: {
        issueNumber: '0003',
        question: 'Question to missing section'
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(false);
    expect(response.data.error).toHaveProperty('type', 'SectionNotFoundError');
  });
});