// ABOUTME: Tests response field naming consistency in MCP tools
// ABOUTME: Ensures standardized parameter naming conventions are followed

const {
  mcp__listIssues,
  mcp__showIssue,
  mcp__createIssue,
  mcp__addTask,
  mcp__addNote,
  mcp__addQuestion,
  mcp__logFailure
} = require('../../src/mcp/tools');

// Mock dependencies
jest.mock('../../src/utils/issueManager', () => {
  return {
    getIssues: jest.fn(() => Promise.resolve([
      { 
        issueNumber: '0001', 
        title: 'Test Issue', 
        state: 'open',
        tasks: [] 
      }
    ])),
    getIssueByNumber: jest.fn(() => Promise.resolve({
      issueNumber: '0001',
      title: 'Test Issue',
      state: 'open',
      content: '# Test Issue\n\n## Tasks\n- [ ] Task 1',
      tasks: []
    })),
    getNextIssueNumber: jest.fn(() => Promise.resolve('0002')),
    saveIssue: jest.fn(() => Promise.resolve()),
    addTaskToIssue: jest.fn(() => Promise.resolve({
      id: 'task-1',
      description: 'New task',
      completed: false,
      issueNumber: '0001'
    })),
    isValidIssueNumber: jest.fn(() => Promise.resolve(true))
  };
});

jest.mock('../../src/utils/template', () => {
  return {
    loadTemplate: jest.fn(() => Promise.resolve('# Issue {{NUMBER}}: {{TITLE}}')),
    renderTemplate: jest.fn(() => Promise.resolve('# Issue 0001: Test')),
    validateTemplate: jest.fn(() => Promise.resolve(true)),
    getTemplateList: jest.fn(() => Promise.resolve(['test']))
  };
});

describe('MCP Tool Response Field Naming', () => {
  it('should use issueNumber consistently in createIssue response', async () => {
    const response = await mcp__createIssue({
      template: 'test',
      title: 'Test Issue'
    });

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('issueNumber');
    expect(response.data).not.toHaveProperty('number');
  });

  it('should use issueNumber consistently in listIssues response items', async () => {
    const response = await mcp__listIssues({
      state: 'open'
    });

    expect(response.success).toBe(true);
    expect(response.data[0]).toHaveProperty('issueNumber');
    expect(response.data[0]).not.toHaveProperty('number');
  });

  it('should use issueNumber consistently in showIssue response', async () => {
    const response = await mcp__showIssue({
      issueNumber: '0001'
    });

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('issueNumber');
    expect(response.data).not.toHaveProperty('number');
  });

  it('should use issueNumber consistently in addTask response', async () => {
    const response = await mcp__addTask({
      issueNumber: '0001',
      description: 'New task'
    });

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('issueNumber');
    expect(response.data).not.toHaveProperty('number');
  });
});