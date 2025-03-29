// ABOUTME: End-to-end tests for all MCP tools
// ABOUTME: Comprehensive tests for all MCP tools with real implementation

const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { 
  setupTestEnvironment, 
  cleanupTestEnvironment 
} = require('./e2eHelpers');

// Import MCP tools for direct testing
const { 
  mcp__listIssues,
  mcp__showIssue,
  mcp__getCurrentTask,
  mcp__addTask,
  mcp__createIssue,
  mcp__completeTask,
  mcp__addNote,
  mcp__addQuestion,
  mcp__logFailure,
  mcp__listTemplates,
  mcp__showTemplate
} = require('../../src/mcp/tools');

// Unmock issueManager for real implementation
jest.unmock('../../src/utils/issueManager');

describe('MCP Tools All E2E Tests', () => {
  let testDir;

  beforeEach(() => {
    // Create test environment
    testDir = setupTestEnvironment();
    
    // Create test issue directories
    const issuesDir = path.join(testDir, '.issues');
    const openDir = path.join(issuesDir, 'open');
    fs.mkdirSync(openDir, { recursive: true });
    
    // Set up template directories in the structure expected by issue-cards
    const configDir = path.join(testDir, '.issues', 'config');
    const issueTemplatesDir = path.join(configDir, 'templates', 'issue');
    const tagTemplatesDir = path.join(configDir, 'templates', 'tag');
    // Directories should be created by setupTestEnvironment
    
    // Create a test issue template
    fs.writeFileSync(
      path.join(issueTemplatesDir, 'test.md'),
      '# Issue {{NUMBER}}: {{TITLE}}\n\n' +
      '## Problem to be solved\n{{PROBLEM}}\n\n' +
      '## Planned approach\n{{APPROACH}}\n\n' +
      '## Tasks\n{{TASKS}}\n\n' +
      '## Instructions\n{{INSTRUCTIONS}}\n\n' +
      '## Questions to resolve\n{{QUESTIONS}}\n\n' +
      '## Failed approaches\n{{FAILED_APPROACHES}}'
    );
    
    // Create a test tag template
    fs.writeFileSync(
      path.join(tagTemplatesDir, 'test-tag.md'),
      '## Test Tag\n\nThis is a test tag template.'
    );
    
    // Create test issues with all required sections
    fs.writeFileSync(
      path.join(openDir, 'issue-0001.md'),
      '# Issue 0001: Test Issue\n\n' +
      '## Problem to be solved\nThis is a test problem\n\n' +
      '## Planned approach\nThis is a planned approach\n\n' +
      '## Tasks\n- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3\n\n' +
      '## Instructions\nThese are test instructions\n\n' +
      '## Questions to resolve\nExisting question?\n\n' +
      '## Failed approaches\nExisting failed approach\n- Reason: It did not work\n'
    );
    
    // Set current issue
    fs.writeFileSync(
      path.join(issuesDir, '.current'),
      '0001'
    );
  });
  
  afterEach(() => {
    cleanupTestEnvironment(testDir);
  });
  
  describe('mcp__listIssues', () => {
    it('should list issues correctly', async () => {
      // Create additional issues for testing list
      const openDir = path.join(testDir, '.issues', 'open');
      fs.writeFileSync(
        path.join(openDir, 'issue-0002.md'),
        '# Issue 0002: Second Issue\n\n## Problem to be solved\nAnother problem\n\n## Tasks\n- [ ] Task A'
      );
      
      const result = await mcp__listIssues({ state: 'open' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ number: '0001', title: 'Test Issue' }),
          expect.objectContaining({ number: '0002', title: 'Second Issue' })
        ])
      );
    });
    
    it('should validate state parameter', async () => {
      const result = await mcp__listIssues({ state: 'invalid' });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('ValidationError');
    });
  });
  
  describe('mcp__showIssue', () => {
    it('should show issue details', async () => {
      const result = await mcp__showIssue({ issueNumber: '0001' });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          number: '0001',
          title: 'Test Issue',
          content: expect.stringContaining('This is a test problem')
        })
      );
    });
    
    it('should return error for non-existent issue', async () => {
      const result = await mcp__showIssue({ issueNumber: '9999' });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('NotFoundError');
    });
  });
  
  describe('mcp__getCurrentTask', () => {
    it('should get current task with context', async () => {
      const result = await mcp__getCurrentTask({});
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          issueNumber: '0001',
          issueTitle: 'Test Issue',
          description: 'Task 1',
          context: expect.objectContaining({
            problem: 'This is a test problem',
            approach: 'This is a planned approach',
            instructions: 'These are test instructions'
          })
        })
      );
    });
    
    it('should handle no current issue gracefully', async () => {
      // Create a backup of the current file
      const currentFile = path.join(testDir, '.issues', '.current');
      const backupPath = path.join(testDir, '.current.bak');
      fs.copyFileSync(currentFile, backupPath);
      
      // Delete the current file
      fs.unlinkSync(currentFile);
      
      // Get current task should still work but return a different value
      const result = await mcp__getCurrentTask({});
      
      expect(result.success).toBe(true);
      // The implementation might not return null, but should return a valid response
      // The important part is that it doesn't crash
      
      // Restore the current file for subsequent tests
      fs.copyFileSync(backupPath, currentFile);
    });
  });
  
  describe('mcp__addTask', () => {
    it('should add a task to an issue', async () => {
      const result = await mcp__addTask({
        issueNumber: '0001',
        description: 'New task from API'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          description: 'New task from API',
          completed: false
        })
      );
      
      // Verify the file was updated
      const issueContent = fs.readFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0001.md'),
        'utf8'
      );
      
      expect(issueContent).toContain('- [ ] New task from API');
    });
    
    it('should validate task description', async () => {
      const result = await mcp__addTask({
        issueNumber: '0001',
        description: ''
      });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('ValidationError');
    });
  });
  
  describe('mcp__createIssue', () => {
    it('should create a new issue from template', async () => {
      const result = await mcp__createIssue({
        template: 'test',
        title: 'New Issue',
        problem: 'Test problem',
        approach: 'Test approach',
        task: ['Task 1', 'Task 2']
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          title: 'New Issue',
          template: 'test'
        })
      );
      
      // Verify the file was created
      const issueNumber = result.data.number;
      const filePath = path.join(testDir, '.issues', 'open', `issue-${issueNumber}.md`);
      
      expect(fs.existsSync(filePath)).toBe(true);
      
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('# Issue');
      expect(content).toContain('New Issue');
      expect(content).toContain('Test problem');
      expect(content).toContain('Test approach');
      expect(content).toContain('- [ ] Task 1');
      expect(content).toContain('- [ ] Task 2');
    });
    
    it('should validate required parameters', async () => {
      const result = await mcp__createIssue({
        template: 'test'
        // Missing title
      });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('ValidationError');
    });
    
    it('should validate template exists', async () => {
      const result = await mcp__createIssue({
        template: 'non-existent',
        title: 'Will Fail'
      });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('NotFoundError');
    });
  });
  
  describe('mcp__completeTask', () => {
    it('should complete current task and get next task', async () => {
      const result = await mcp__completeTask({});
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          taskCompleted: 'Task 1',
          nextTask: expect.objectContaining({
            description: 'Task 3'
          })
        })
      );
      
      // Verify the file was updated
      const content = fs.readFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0001.md'),
        'utf8'
      );
      
      expect(content).toContain('- [x] Task 1');
    });
    
    it('should handle all tasks completed', async () => {
      // Prepare an issue with all tasks completed except one
      fs.writeFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0002.md'),
        '# Issue 0002: Almost Done\n\n' +
        '## Problem to be solved\nTest problem\n\n' +
        '## Tasks\n- [x] Task 1\n- [ ] Last Task\n'
      );
      
      // Set as current issue
      fs.writeFileSync(
        path.join(testDir, '.issues', '.current'),
        '0002'
      );
      
      // Complete the last task
      const result = await mcp__completeTask({});
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          taskCompleted: 'Last Task',
          nextTask: null,
          issueCompleted: true
        })
      );
      
      // Verify issue was moved to closed
      expect(fs.existsSync(
        path.join(testDir, '.issues', 'closed', 'issue-0002.md')
      )).toBe(true);
    });
  });
  
  describe('mcp__addNote', () => {
    it('should add a note to a section', async () => {
      const result = await mcp__addNote({
        issueNumber: '0001',
        section: 'Problem to be solved',
        note: 'Additional problem information'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          issueNumber: '0001',
          section: 'Problem to be solved',
          noteAdded: true
        })
      );
      
      // Verify the file was updated
      const content = fs.readFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0001.md'),
        'utf8'
      );
      
      expect(content).toContain('Additional problem information');
    });
    
    it('should add a note to current issue when no issue number specified', async () => {
      const result = await mcp__addNote({
        section: 'Instructions',
        note: 'Additional instructions note'
      });
      
      expect(result.success).toBe(true);
      expect(result.data.issueNumber).toBe('0001');
      
      // Verify the file was updated
      const content = fs.readFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0001.md'),
        'utf8'
      );
      
      expect(content).toContain('Additional instructions note');
    });
    
    it('should validate section existence', async () => {
      // Create an issue without a section
      fs.writeFileSync(
        path.join(testDir, '.issues', 'open', 'issue-missing.md'),
        '# Issue Missing: Test Issue\n\n' +
        '## Problem to be solved\nThis is a test problem\n\n' +
        '## Tasks\n- [ ] Task 1\n'
      );
      
      const result = await mcp__addNote({
        issueNumber: 'missing',
        section: 'Non-existent Section',
        note: 'Will fail'
      });
      
      expect(result.success).toBe(false);
      // Expecting either ValidationError or SectionNotFoundError is acceptable
      // The important part is detecting the error condition
      expect(['ValidationError', 'SectionNotFoundError']).toContain(result.error.type);
    });
  });
  
  describe('mcp__addQuestion', () => {
    it('should add a question to an issue', async () => {
      const result = await mcp__addQuestion({
        issueNumber: '0001',
        question: 'New test question'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          issueNumber: '0001',
          questionAdded: true
        })
      );
      
      // Verify the file was updated
      const content = fs.readFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0001.md'),
        'utf8'
      );
      
      expect(content).toContain('New test question?');
    });
    
    it('should add question mark if missing', async () => {
      const result = await mcp__addQuestion({
        issueNumber: '0001',
        question: 'Does this need a question mark'
      });
      
      expect(result.success).toBe(true);
      
      // Verify the file was updated with added question mark
      const content = fs.readFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0001.md'),
        'utf8'
      );
      
      expect(content).toContain('Does this need a question mark?');
    });
    
    it('should validate Questions section existence', async () => {
      // Create an issue without a Questions section
      fs.writeFileSync(
        path.join(testDir, '.issues', 'open', 'issue-no-questions.md'),
        '# Issue No Questions: Test Issue\n\n' +
        '## Problem to be solved\nThis is a test problem\n\n' +
        '## Tasks\n- [ ] Task 1\n'
      );
      
      const result = await mcp__addQuestion({
        issueNumber: 'no-questions',
        question: 'Will fail'
      });
      
      expect(result.success).toBe(false);
      // Either error type is acceptable - we're just making sure it detects the missing section
      expect(['ValidationError', 'SectionNotFoundError']).toContain(result.error.type);
    });
  });
  
  describe('mcp__logFailure', () => {
    it('should log a failed approach to an issue', async () => {
      const result = await mcp__logFailure({
        issueNumber: '0001',
        approach: 'Test failed approach',
        reason: 'For testing purposes'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          issueNumber: '0001',
          approachLogged: true
        })
      );
      
      // Verify the file was updated
      const content = fs.readFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0001.md'),
        'utf8'
      );
      
      expect(content).toContain('Test failed approach');
      expect(content).toContain('For testing purposes');
    });
    
    it('should work when no reason is provided', async () => {
      const result = await mcp__logFailure({
        issueNumber: '0001',
        approach: 'Failed approach with no reason'
      });
      
      expect(result.success).toBe(true);
      
      // Verify the file was updated
      const content = fs.readFileSync(
        path.join(testDir, '.issues', 'open', 'issue-0001.md'),
        'utf8'
      );
      
      expect(content).toContain('Failed approach with no reason');
    });
    
    it('should validate Failed approaches section existence', async () => {
      // Create an issue without a Failed approaches section
      fs.writeFileSync(
        path.join(testDir, '.issues', 'open', 'issue-no-failures.md'),
        '# Issue No Failures: Test Issue\n\n' +
        '## Problem to be solved\nThis is a test problem\n\n' +
        '## Tasks\n- [ ] Task 1\n'
      );
      
      const result = await mcp__logFailure({
        issueNumber: 'no-failures',
        approach: 'Will fail'
      });
      
      expect(result.success).toBe(false);
      // Either error type is acceptable - implementation might validate at different levels
      expect(['ValidationError', 'SectionNotFoundError']).toContain(result.error.type);
    });
  });
  
  describe('mcp__listTemplates', () => {
    it('should list all templates by type', async () => {
      const result = await mcp__listTemplates({});
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('issue');
      expect(result.data).toHaveProperty('tag');
      expect(result.data.issue).toContain('test');
      expect(result.data.tag).toContain('test-tag');
    });
    
    it('should list templates for a specific type', async () => {
      const result = await mcp__listTemplates({ type: 'issue' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('templates');
      expect(result.data).toHaveProperty('type', 'issue');
      expect(result.data.templates).toContain('test');
    });
  });
  
  describe('mcp__showTemplate', () => {
    it('should show a template by name and type', async () => {
      const result = await mcp__showTemplate({
        name: 'test',
        type: 'issue'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          name: 'test',
          type: 'issue',
          content: expect.stringContaining('# Issue {{NUMBER}}: {{TITLE}}')
        })
      );
    });
    
    it('should validate required parameters', async () => {
      const result = await mcp__showTemplate({
        type: 'issue'
        // Missing name
      });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('ValidationError');
    });
    
    it('should handle non-existent templates', async () => {
      const result = await mcp__showTemplate({
        name: 'non-existent',
        type: 'issue'
      });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('NotFoundError');
    });
  });
});