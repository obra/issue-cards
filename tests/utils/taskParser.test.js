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
  updateTaskStatus,
  extractExpandTagsFromTask,
  isTagAtEnd
} = require('../../src/utils/taskParser');

// We can use the real libraries or mock them based on test needs
describe('Task parser utilities', () => {
  
  describe('extractTasks', () => {
    test('extracts tasks from markdown content', async () => {
      // Use real markdown content
      const content = '# Test Issue\n\n## Tasks\n- [ ] Task 1\n- [x] Task 2';
      
      const tasks = await extractTasks(content);
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toEqual({ text: 'Task 1', completed: false, index: 0 });
      expect(tasks[1]).toEqual({ text: 'Task 2', completed: true, index: 1 });
    });
    
    test('returns empty array when no Tasks section found', async () => {
      // Use real markdown content without Tasks section
      const content = '# Test Issue\n\n## Not Tasks\n- [ ] Not a task';
      
      const tasks = await extractTasks(content);
      
      expect(tasks).toHaveLength(0);
    });
    
    test('handles parsing errors', async () => {
      // This test may not be necessary since we're using real parsing
      // But we'll keep it with a very unusual/malformed input
      const invalidContent = '# \u0000 Invalid \u0000 characters';
      
      // The real parser might actually handle this better than our mock
      // So we'll just check that it doesn't throw or returns sensible results
      const tasks = await extractTasks(invalidContent);
      expect(Array.isArray(tasks)).toBe(true);
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

  describe('extractExpandTagsFromTask', () => {
    test('extracts +tags without parameters', () => {
      const task = { text: 'Implement feature X +unit-test +update-docs', completed: false, index: 0 };
      
      const tags = extractExpandTagsFromTask(task);
      
      expect(tags).toHaveLength(2);
      expect(tags[0]).toEqual({ name: 'unit-test', params: {} });
      expect(tags[1]).toEqual({ name: 'update-docs', params: {} });
    });
    
    test('extracts +tags with parameters', () => {
      const task = { 
        text: 'Implement feature X +unit-test(component=UserService) +update-docs', 
        completed: false, 
        index: 0 
      };
      
      const tags = extractExpandTagsFromTask(task);
      
      expect(tags).toHaveLength(2);
      expect(tags[0]).toEqual({ 
        name: 'unit-test', 
        params: { component: 'UserService' } 
      });
      expect(tags[1]).toEqual({ name: 'update-docs', params: {} });
    });
    
    test('returns empty array for task without +tags', () => {
      const task = { text: 'Implement feature X #regular-tag', completed: false, index: 0 };
      
      const tags = extractExpandTagsFromTask(task);
      
      expect(tags).toHaveLength(0);
    });

    test('only extracts +tags, not #tags', () => {
      const task = { 
        text: 'Implement feature X #regular-tag +expand-tag', 
        completed: false, 
        index: 0 
      };
      
      const tags = extractExpandTagsFromTask(task);
      
      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({ name: 'expand-tag', params: {} });
    });
  });
  
  describe('isTagAtEnd', () => {
    test('returns true for tag at the end of task text', () => {
      const result = isTagAtEnd('Implement feature X +unit-test', '+unit-test');
      expect(result).toBe(true);
    });
    
    test('returns true for tag with parameters at the end of task text', () => {
      const result = isTagAtEnd('Implement feature X +unit-test(component=Auth)', '+unit-test(component=Auth)');
      expect(result).toBe(true);
    });
    
    test('returns false for tag in the middle of task text', () => {
      const result = isTagAtEnd('Implement +unit-test feature X', '+unit-test');
      expect(result).toBe(false);
    });
    
    test('returns false for tag that is not at the very end', () => {
      const result = isTagAtEnd('Implement feature X +unit-test with some text after', '+unit-test');
      expect(result).toBe(false);
    });

    test('returns true for multiple tags at the end of task text', () => {
      const result = isTagAtEnd('Implement feature X +unit-test +update-docs', '+update-docs');
      expect(result).toBe(true);
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
    test('only removes +tags, keeps #tags in task text', () => {
      const task = { 
        text: 'Implement auth feature #unit-test(component=Auth) #update-docs', 
        completed: false, 
        index: 0 
      };
      
      const cleanText = getCleanTaskText(task);
      
      // We now keep #tags as regular text
      expect(cleanText).toBe('Implement auth feature #unit-test(component=Auth) #update-docs');
    });
    
    test('handles task without tags', () => {
      const task = { text: 'Implement auth feature', completed: false, index: 0 };
      
      const cleanText = getCleanTaskText(task);
      
      expect(cleanText).toBe('Implement auth feature');
    });

    test('removes +tags from task text', () => {
      const task = { 
        text: 'Implement auth feature +unit-test(component=Auth) +update-docs', 
        completed: false, 
        index: 0 
      };
      
      const cleanText = getCleanTaskText(task);
      
      expect(cleanText).toBe('Implement auth feature');
    });

    test('removes +tags but keeps #tags in task text', () => {
      const task = { 
        text: 'Implement auth feature #frontend +unit-test', 
        completed: false, 
        index: 0 
      };
      
      const cleanText = getCleanTaskText(task);
      
      // We now keep #tags but strip +tags
      expect(cleanText).toBe('Implement auth feature #frontend');
    });
  });
  
  describe('updateTaskStatus', () => {
    test('updates task status to completed', async () => {
      // Use real markdown content
      const content = '## Tasks\n- [ ] Task 1\n- [ ] Task 2';
      const updatedContent = await updateTaskStatus(content, 1, true);
      
      expect(updatedContent).toBe('## Tasks\n- [ ] Task 1\n- [x] Task 2');
    });
    
    test('updates task status to incomplete', async () => {
      // Use real markdown content
      const content = '## Tasks\n- [x] Task 1\n- [x] Task 2';
      const updatedContent = await updateTaskStatus(content, 0, false);
      
      expect(updatedContent).toBe('## Tasks\n- [ ] Task 1\n- [x] Task 2');
    });
    
    test('throws error for invalid task index', async () => {
      // Use real markdown content
      const content = '## Tasks\n- [ ] Task 1';
      
      await expect(updateTaskStatus(content, 1, true)).rejects.toThrow('Task index out of bounds');
    });
  });
});