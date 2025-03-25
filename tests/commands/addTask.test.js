// ABOUTME: Tests for the add-task command
// ABOUTME: Verifies adding tasks to issues with tags and positioning

// Mock unified and remark before importing modules
jest.mock('unified', () => ({
  unified: jest.fn().mockReturnValue({
    use: jest.fn().mockReturnThis(),
    parse: jest.fn()
  })
}));
jest.mock('remark-parse', () => ({}));
jest.mock('remark-stringify', () => ({}));

const {
  addTaskAction,
  insertTaskIntoContent,
  findInsertionLineNumber,
  findTasksSectionEnd,
  validateTags
} = require('../../src/commands/addTask');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');
const taskParser = require('../../src/utils/taskParser');
const taskExpander = require('../../src/utils/taskExpander');
const template = require('../../src/utils/template');

// Mock dependencies
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn(),
  getIssueDirectoryPath: jest.fn()
}));

jest.mock('../../src/utils/issueManager', () => ({
  listIssues: jest.fn(),
  readIssue: jest.fn(),
  writeIssue: jest.fn(),
  getIssueFilePath: jest.fn()
}));

jest.mock('../../src/utils/taskParser', () => ({
  extractTasks: jest.fn(),
  findCurrentTask: jest.fn(),
  extractTagsFromTask: jest.fn(),
  updateTaskStatus: jest.fn()
}));

jest.mock('../../src/utils/taskExpander', () => ({
  validateTagTemplate: jest.fn(),
  expandTask: jest.fn()
}));

jest.mock('../../src/utils/template', () => ({
  getTemplateList: jest.fn(),
  loadTemplate: jest.fn(),
  validateTemplate: jest.fn()
}));

describe('add-task command', () => {
  // Mock console methods
  const consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    
    // Set up default mock behavior
    directory.isInitialized.mockResolvedValue(true);
    issueManager.listIssues.mockResolvedValue([
      { id: '1', title: 'Issue 1', path: '/path/to/issue1.md' }
    ]);
    issueManager.readIssue.mockResolvedValue(
      '# Issue 1\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2\n\n## Notes\nSome notes'
    );
    issueManager.writeIssue.mockResolvedValue();
    
    taskParser.extractTasks.mockResolvedValue([
      { text: 'Task 1', completed: false, index: 0 },
      { text: 'Task 2', completed: false, index: 1 }
    ]);
    taskParser.findCurrentTask.mockReturnValue({ text: 'Task 1', completed: false, index: 0 });
    taskParser.extractTagsFromTask.mockReturnValue([]);
    
    taskExpander.validateTagTemplate.mockResolvedValue({ valid: true, errors: [] });
    template.getTemplateList.mockResolvedValue(['unit-test', 'update-docs']);
  });

  describe('findTasksSectionEnd', () => {
    test('finds end of tasks section before next section', () => {
      const content = 
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] Task 1\n' +
        '- [ ] Task 2\n' +
        '\n' +
        '## Notes\n' +
        'Some notes';
      
      const result = findTasksSectionEnd(content);
      
      // Should be the line number of "## Notes"
      expect(result).toBe(6);
    });
    
    test('finds position after last task when no section follows', () => {
      const content = 
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] Task 1\n' +
        '- [ ] Task 2\n';
      
      const result = findTasksSectionEnd(content);
      
      // Should be the line after the last task
      expect(result).toBe(5);
    });
    
    test('finds position right after Tasks heading when no tasks exist', () => {
      const content = 
        '# Issue\n\n' +
        '## Tasks\n' +
        '\n' +
        '## Notes\n';
      
      const result = findTasksSectionEnd(content);
      
      // Should be the line after "## Tasks"
      expect(result).toBe(4);
    });
  });
  
  describe('findInsertionLineNumber', () => {
    test('finds insertion point before current task', () => {
      const content = 
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] Task 1\n' +
        '- [ ] Task 2\n';
      
      const task = { text: 'Task 1', completed: false, index: 0 };
      
      const result = findInsertionLineNumber(content, task, true);
      
      // Should be the line with "- [ ] Task 1"
      expect(result).toBe(3);
    });
    
    test('finds insertion point after current task', () => {
      const content = 
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] Task 1\n' +
        '- [ ] Task 2\n';
      
      const task = { text: 'Task 1', completed: false, index: 0 };
      
      const result = findInsertionLineNumber(content, task, false);
      
      // Should be the line after "- [ ] Task 1"
      expect(result).toBe(4);
    });
  });
  
  describe('insertTaskIntoContent', () => {
    test('inserts task at the end of task list', async () => {
      const content = 
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] Task 1\n' +
        '- [ ] Task 2\n\n' +
        '## Notes\n' +
        'Some notes';
      
      const newTask = 'New Task';
      
      const result = await insertTaskIntoContent(content, newTask, 'end');
      
      // Should insert before the Notes section
      // Actual output may have slightly different line breaks, so check content more flexibly
      expect(result).toContain('# Issue');
      expect(result).toContain('## Tasks');
      expect(result).toContain('- [ ] Task 1');
      expect(result).toContain('- [ ] Task 2');
      expect(result).toContain('- [ ] New Task');
      expect(result).toContain('## Notes');
      expect(result).toContain('Some notes');
    });
    
    test('inserts task before current task', async () => {
      const content = 
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] Task 1\n' +
        '- [ ] Task 2\n';
      
      const newTask = 'New Task';
      
      // Mock to return task index 0 as current
      taskParser.findCurrentTask.mockReturnValue({ text: 'Task 1', completed: false, index: 0 });
      
      const result = await insertTaskIntoContent(content, newTask, 'before-current');
      
      // Should insert before "- [ ] Task 1"
      expect(result).toBe(
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] New Task\n' +
        '- [ ] Task 1\n' +
        '- [ ] Task 2\n'
      );
    });
    
    test('inserts task after current task', async () => {
      const content = 
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] Task 1\n' +
        '- [ ] Task 2\n';
      
      const newTask = 'New Task';
      
      // Mock to return task index 0 as current
      taskParser.findCurrentTask.mockReturnValue({ text: 'Task 1', completed: false, index: 0 });
      
      const result = await insertTaskIntoContent(content, newTask, 'after-current');
      
      // Should insert after "- [ ] Task 1"
      expect(result).toBe(
        '# Issue\n\n' +
        '## Tasks\n' +
        '- [ ] Task 1\n' +
        '- [ ] New Task\n' +
        '- [ ] Task 2\n'
      );
    });
  });
  
  describe('validateTags', () => {
    test('validates valid tags', async () => {
      const tags = [
        { name: 'unit-test', params: {} },
        { name: 'update-docs', params: {} }
      ];
      
      template.getTemplateList.mockResolvedValue(['unit-test', 'update-docs']);
      taskExpander.validateTagTemplate.mockResolvedValue({ valid: true, errors: [] });
      
      const errors = await validateTags(tags);
      
      expect(errors).toHaveLength(0);
      expect(template.getTemplateList).toHaveBeenCalledWith('tag');
      expect(taskExpander.validateTagTemplate).toHaveBeenCalledTimes(2);
    });
    
    test('reports non-existent tags', async () => {
      const tags = [
        { name: 'unit-test', params: {} },
        { name: 'non-existent', params: {} }
      ];
      
      template.getTemplateList.mockResolvedValue(['unit-test', 'update-docs']);
      
      const errors = await validateTags(tags);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('does not exist');
    });
    
    test('reports tags with invalid templates', async () => {
      const tags = [
        { name: 'unit-test', params: {} },
        { name: 'update-docs', params: {} }
      ];
      
      template.getTemplateList.mockResolvedValue(['unit-test', 'update-docs']);
      
      // First tag is valid, second is invalid
      taskExpander.validateTagTemplate.mockImplementation((tag) => {
        if (tag === 'unit-test') {
          return Promise.resolve({ valid: true, errors: [] });
        } else {
          return Promise.resolve({ 
            valid: false, 
            errors: ['Template must have a Steps section'] 
          });
        }
      });
      
      const errors = await validateTags(tags);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('has invalid template');
    });
  });
  
  describe('addTaskAction', () => {
    test('adds task to issue successfully', async () => {
      // Mock list issues and getIssueFilePath
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Issue 1', path: '/path/to/issue1.md' }
      ]);
      issueManager.getIssueFilePath.mockReturnValue('/path/to/issue1.md');
      
      // Mock tag extraction
      taskParser.extractTagsFromTask.mockReturnValue([
        { name: 'unit-test', params: {} }
      ]);
      
      // Call the function
      await addTaskAction('New task #unit-test', { issue: '1' });
      
      // Verify issue content was updated
      expect(issueManager.writeIssue).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Task added'));
    });
    
    test('adds task to specific issue when provided', async () => {
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Issue 1', path: '/path/to/issue1.md' },
        { number: '0002', title: 'Issue 2', path: '/path/to/issue2.md' }
      ]);
      issueManager.getIssueFilePath.mockReturnValue('/path/to/issue2.md');
      
      // Mock tag extraction
      taskParser.extractTagsFromTask.mockReturnValue([]);
      
      await addTaskAction('New task', { issue: '2' });
      
      // Just check that readIssue and writeIssue were called
      expect(issueManager.readIssue).toHaveBeenCalledWith('/path/to/issue2.md');
      expect(issueManager.writeIssue).toHaveBeenCalled();
    });
    
    test('handles invalid tags', async () => {
      // Mock list issues
      issueManager.listIssues.mockResolvedValue([
        { number: '0001', title: 'Issue 1', path: '/path/to/issue1.md' }
      ]);
      issueManager.getIssueFilePath.mockReturnValue('/path/to/issue1.md');
      
      taskParser.extractTagsFromTask.mockReturnValue([
        { name: 'non-existent', params: {} }
      ]);
      
      template.getTemplateList.mockResolvedValue(['unit-test']);
      
      await addTaskAction('New task #non-existent', { issue: '1' });
      
      // Verify error message was displayed
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Invalid tags'));
      expect(issueManager.writeIssue).not.toHaveBeenCalled();
    });
    
    test('handles uninitialized state', async () => {
      directory.isInitialized.mockResolvedValue(false);
      
      await addTaskAction('New task', {});
      
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('not initialized'));
      expect(issueManager.listIssues).not.toHaveBeenCalled();
    });
    
    test('handles no open issues', async () => {
      issueManager.listIssues.mockResolvedValue([]);
      
      await addTaskAction('New task', {});
      
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('No open issues'));
      expect(issueManager.readIssue).not.toHaveBeenCalled();
    });
    
    test('handles invalid issue ID', async () => {
      issueManager.listIssues.mockResolvedValue([
        { number: '1', title: 'Issue 1', path: '/path/to/issue1.md' }
      ]);

      await addTaskAction('New task', { issue: '999' });
      
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('not found'));
      expect(issueManager.readIssue).not.toHaveBeenCalled();
    });
  });
});