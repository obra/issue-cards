// ABOUTME: Tests for task parsing utilities
// ABOUTME: Verifies markdown task extraction, status tracking, and tag detection

const {
  extractTasks,
  findTaskByIndex,
  findCurrentTask,
  extractTagsFromTask,
  extractTagNamesFromTask,
  parseTag,
  hasTag,
  getTagParameters,
  getCleanTaskText,
  updateTaskStatus
} = require('../../src/utils/taskParser');

// Mock dependencies
jest.mock('unified', () => ({
  unified: jest.fn().mockReturnValue({
    use: jest.fn().mockReturnThis(),
    parse: jest.fn()
  })
}));

jest.mock('remark-parse', () => ({}));
jest.mock('remark-stringify', () => ({}));

describe('Task parser utilities', () => {
  // Mock parse function
  const mockParse = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    mockParse.mockReset();
    require('unified').unified().parse.mockReset();
    require('unified').unified().parse.mockImplementation(mockParse);
  });
  
  describe('extractTasks', () => {
    test('extracts tasks from markdown content', async () => {
      // Mock the parsed markdown structure
      mockParse.mockResolvedValue({
        children: [
          // Heading for Tasks section
          {
            type: 'heading',
            children: [{ type: 'text', value: 'Tasks' }]
          },
          // List with task items
          {
            type: 'list',
            children: [
              {
                type: 'listItem',
                children: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: '[ ] Task 1' }]
                }]
              },
              {
                type: 'listItem',
                children: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: '[x] Task 2' }]
                }]
              }
            ]
          }
        ]
      });
      
      const tasks = await extractTasks('# Test\n\n## Tasks\n- [ ] Task 1\n- [x] Task 2');
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toEqual({ text: 'Task 1', completed: false, index: 0 });
      expect(tasks[1]).toEqual({ text: 'Task 2', completed: true, index: 1 });
    });
    
    test('returns empty array when no Tasks section found', async () => {
      // Mock the parsed markdown with no Tasks section
      mockParse.mockResolvedValue({
        children: [
          {
            type: 'heading',
            children: [{ type: 'text', value: 'Not Tasks' }]
          }
        ]
      });
      
      const tasks = await extractTasks('# Test\n\n## Not Tasks\n- [ ] Not a task');
      
      expect(tasks).toHaveLength(0);
    });
    
    test('handles parsing errors', async () => {
      // Mock a parsing error
      mockParse.mockRejectedValue(new Error('Parse error'));
      
      await expect(extractTasks('Invalid markdown')).rejects.toThrow('Failed to parse tasks');
    });
  });
  
  describe('findTaskByIndex', () => {
    test('finds task by index', () => {
      const tasks = [
        { text: 'Task 1', completed: false, index: 0 },
        { text: 'Task 2', completed: true, index: 1 },
        { text: 'Task 3', completed: false, index: 2 }
      ];
      
      const foundTask = findTaskByIndex(tasks, 1);
      
      expect(foundTask).toEqual({ text: 'Task 2', completed: true, index: 1 });
    });
    
    test('returns null for non-existent index', () => {
      const tasks = [
        { text: 'Task 1', completed: false, index: 0 }
      ];
      
      const foundTask = findTaskByIndex(tasks, 99);
      
      expect(foundTask).toBeNull();
    });
  });
  
  describe('findCurrentTask', () => {
    test('finds first uncompleted task', () => {
      const tasks = [
        { text: 'Task 1', completed: true, index: 0 },
        { text: 'Task 2', completed: false, index: 1 },
        { text: 'Task 3', completed: false, index: 2 }
      ];
      
      const currentTask = findCurrentTask(tasks);
      
      expect(currentTask).toEqual({ text: 'Task 2', completed: false, index: 1 });
    });
    
    test('returns null when all tasks completed', () => {
      const tasks = [
        { text: 'Task 1', completed: true, index: 0 },
        { text: 'Task 2', completed: true, index: 1 }
      ];
      
      const currentTask = findCurrentTask(tasks);
      
      expect(currentTask).toBeNull();
    });
    
    test('returns null for empty task list', () => {
      const currentTask = findCurrentTask([]);
      
      expect(currentTask).toBeNull();
    });
  });
  
  describe('parseTag', () => {
    test('parses tag without parameters', () => {
      const tag = parseTag('unit-test');
      
      expect(tag).toEqual({
        name: 'unit-test',
        params: {}
      });
    });
    
    test('parses tag with single parameter', () => {
      const tag = parseTag('unit-test(component=UserService)');
      
      expect(tag).toEqual({
        name: 'unit-test',
        params: { component: 'UserService' }
      });
    });
    
    test('parses tag with multiple parameters', () => {
      const tag = parseTag('test(component=Auth,scope=login,priority=high)');
      
      expect(tag).toEqual({
        name: 'test',
        params: {
          component: 'Auth',
          scope: 'login',
          priority: 'high'
        }
      });
    });
    
    test('handles malformed parameter string', () => {
      const tag = parseTag('test(component=Auth,badparam)');
      
      expect(tag).toEqual({
        name: 'test',
        params: { component: 'Auth' }
      });
    });
  });
  
  describe('extractTagsFromTask', () => {
    test('extracts tags without parameters', () => {
      const task = { text: 'Implement feature X #unit-test #update-docs', completed: false, index: 0 };
      
      const tags = extractTagsFromTask(task);
      
      expect(tags).toHaveLength(2);
      expect(tags[0]).toEqual({ name: 'unit-test', params: {} });
      expect(tags[1]).toEqual({ name: 'update-docs', params: {} });
    });
    
    test('extracts tags with parameters', () => {
      const task = { 
        text: 'Implement feature X #unit-test(component=UserService) #update-docs', 
        completed: false, 
        index: 0 
      };
      
      const tags = extractTagsFromTask(task);
      
      expect(tags).toHaveLength(2);
      expect(tags[0]).toEqual({ 
        name: 'unit-test', 
        params: { component: 'UserService' } 
      });
      expect(tags[1]).toEqual({ name: 'update-docs', params: {} });
    });
    
    test('returns empty array for task without tags', () => {
      const task = { text: 'Implement feature X', completed: false, index: 0 };
      
      const tags = extractTagsFromTask(task);
      
      expect(tags).toHaveLength(0);
    });
  });
  
  describe('extractTagNamesFromTask', () => {
    test('extracts tag names only', () => {
      const task = { 
        text: 'Implement feature X #unit-test(component=UserService) #update-docs', 
        completed: false, 
        index: 0 
      };
      
      const tagNames = extractTagNamesFromTask(task);
      
      expect(tagNames).toHaveLength(2);
      expect(tagNames).toEqual(['unit-test', 'update-docs']);
    });
  });
  
  describe('hasTag', () => {
    test('returns true when task has tag', () => {
      const task = { text: 'Implement feature X #unit-test #update-docs', completed: false, index: 0 };
      
      expect(hasTag(task, 'unit-test')).toBe(true);
      expect(hasTag(task, 'update-docs')).toBe(true);
    });
    
    test('returns false when task does not have tag', () => {
      const task = { text: 'Implement feature X #unit-test', completed: false, index: 0 };
      
      expect(hasTag(task, 'non-existent')).toBe(false);
    });
  });
  
  describe('getTagParameters', () => {
    test('returns parameters for existing tag', () => {
      const task = { 
        text: 'Implement X #unit-test(component=Auth,scope=login) #update-docs', 
        completed: false, 
        index: 0 
      };
      
      const params = getTagParameters(task, 'unit-test');
      
      expect(params).toEqual({ component: 'Auth', scope: 'login' });
    });
    
    test('returns empty object for tag without parameters', () => {
      const task = { text: 'Implement X #unit-test #update-docs', completed: false, index: 0 };
      
      const params = getTagParameters(task, 'unit-test');
      
      expect(params).toEqual({});
    });
    
    test('returns null for non-existent tag', () => {
      const task = { text: 'Implement X #unit-test', completed: false, index: 0 };
      
      const params = getTagParameters(task, 'non-existent');
      
      expect(params).toBeNull();
    });
  });
  
  describe('getCleanTaskText', () => {
    test('removes all tags from task text', () => {
      const task = { 
        text: 'Implement auth feature #unit-test(component=Auth) #update-docs', 
        completed: false, 
        index: 0 
      };
      
      const cleanText = getCleanTaskText(task);
      
      expect(cleanText).toBe('Implement auth feature');
    });
    
    test('handles task without tags', () => {
      const task = { text: 'Implement auth feature', completed: false, index: 0 };
      
      const cleanText = getCleanTaskText(task);
      
      expect(cleanText).toBe('Implement auth feature');
    });
  });
  
  describe('updateTaskStatus', () => {
    beforeEach(() => {
      // Reset mocks
      mockParse.mockReset();
    });
    
    test('updates task status to completed', async () => {
      // Mock extractTasks to return our test tasks
      mockParse.mockResolvedValueOnce({
        children: [
          // Heading for Tasks section
          {
            type: 'heading',
            children: [{ type: 'text', value: 'Tasks' }]
          },
          // List with task items
          {
            type: 'list',
            children: [
              {
                type: 'listItem',
                children: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: '[ ] Task 1' }]
                }]
              },
              {
                type: 'listItem',
                children: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: '[ ] Task 2' }]
                }]
              }
            ]
          }
        ]
      });
      
      const content = '## Tasks\n- [ ] Task 1\n- [ ] Task 2';
      const updatedContent = await updateTaskStatus(content, 1, true);
      
      expect(updatedContent).toBe('## Tasks\n- [ ] Task 1\n- [x] Task 2');
    });
    
    test('updates task status to incomplete', async () => {
      // Mock extractTasks to return our test tasks
      mockParse.mockResolvedValueOnce({
        children: [
          // Heading for Tasks section
          {
            type: 'heading',
            children: [{ type: 'text', value: 'Tasks' }]
          },
          // List with task items
          {
            type: 'list',
            children: [
              {
                type: 'listItem',
                children: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: '[x] Task 1' }]
                }]
              },
              {
                type: 'listItem',
                children: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: '[x] Task 2' }]
                }]
              }
            ]
          }
        ]
      });
      
      const content = '## Tasks\n- [x] Task 1\n- [x] Task 2';
      const updatedContent = await updateTaskStatus(content, 0, false);
      
      expect(updatedContent).toBe('## Tasks\n- [ ] Task 1\n- [x] Task 2');
    });
    
    test('throws error for invalid task index', async () => {
      // Mock extractTasks to return a single task
      mockParse.mockResolvedValueOnce({
        children: [
          // Heading for Tasks section
          {
            type: 'heading',
            children: [{ type: 'text', value: 'Tasks' }]
          },
          // List with task items
          {
            type: 'list',
            children: [
              {
                type: 'listItem',
                children: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: '[ ] Task 1' }]
                }]
              }
            ]
          }
        ]
      });
      
      const content = '## Tasks\n- [ ] Task 1';
      
      await expect(updateTaskStatus(content, 1, true)).rejects.toThrow('Task index out of bounds');
    });
  });
});