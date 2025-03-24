// ABOUTME: Tests for markdown task parsing utilities
// ABOUTME: Verifies task extraction, status tracking, and tag detection

const { unified } = require('unified');
const remarkParse = require('remark-parse');
const {
  extractTasks,
  findTaskByIndex, 
  findCurrentTask,
  updateTaskStatus,
  extractTagsFromTask,
  hasTag
} = require('../../src/utils/taskParser');

describe('Task Parser utilities', () => {
  const sampleMarkdown = `# Issue 0001: Test Issue

## Problem to be solved
This is a test issue.

## Tasks
- [ ] First task
- [x] Second task (completed)
- [ ] Third task with #unit-test tag
- [ ] Fourth task with multiple tags #e2e-test #update-docs
`;

  describe('extractTasks', () => {
    test('extracts tasks from markdown content', async () => {
      const tasks = await extractTasks(sampleMarkdown);
      
      expect(tasks).toHaveLength(4);
      expect(tasks[0].text).toBe('First task');
      expect(tasks[0].completed).toBe(false);
      expect(tasks[0].index).toBe(0);
      
      expect(tasks[1].text).toBe('Second task (completed)');
      expect(tasks[1].completed).toBe(true);
      expect(tasks[1].index).toBe(1);
      
      expect(tasks[2].text).toBe('Third task with #unit-test tag');
      expect(tasks[2].completed).toBe(false);
      expect(tasks[2].index).toBe(2);
    });
    
    test('handles markdown with no tasks', async () => {
      const markdownWithoutTasks = `# Issue 0001: Test Issue

## Problem to be solved
This is a test issue with no tasks.
`;
      
      const tasks = await extractTasks(markdownWithoutTasks);
      
      expect(tasks).toHaveLength(0);
    });
    
    test('ignores tasks outside the Tasks section', async () => {
      const markdownWithTasksOutside = `# Issue 0001: Test Issue

## Problem to be solved
- [ ] This is not a real task, just a list item
- [x] Another list item

## Tasks
- [ ] Real task 1
- [ ] Real task 2
`;
      
      const tasks = await extractTasks(markdownWithTasksOutside);
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0].text).toBe('Real task 1');
      expect(tasks[1].text).toBe('Real task 2');
    });
  });
  
  describe('findTaskByIndex', () => {
    test('finds task by index', async () => {
      const tasks = await extractTasks(sampleMarkdown);
      
      const foundTask = findTaskByIndex(tasks, 2);
      
      expect(foundTask).not.toBeNull();
      expect(foundTask.text).toBe('Third task with #unit-test tag');
      expect(foundTask.index).toBe(2);
    });
    
    test('returns null for invalid index', async () => {
      const tasks = await extractTasks(sampleMarkdown);
      
      const foundTask = findTaskByIndex(tasks, 10);
      
      expect(foundTask).toBeNull();
    });
  });
  
  describe('findCurrentTask', () => {
    test('finds first uncompleted task', async () => {
      const tasks = await extractTasks(sampleMarkdown);
      
      const currentTask = findCurrentTask(tasks);
      
      expect(currentTask).not.toBeNull();
      expect(currentTask.text).toBe('First task');
      expect(currentTask.completed).toBe(false);
      expect(currentTask.index).toBe(0);
    });
    
    test('handles all tasks completed', async () => {
      const allTasksCompleted = `# Issue 0001: Test Issue

## Tasks
- [x] First task
- [x] Second task
`;
      
      const tasks = await extractTasks(allTasksCompleted);
      const currentTask = findCurrentTask(tasks);
      
      expect(currentTask).toBeNull();
    });
    
    test('skips completed tasks', async () => {
      const mixedTasksMarkdown = `# Issue 0001: Test Issue

## Tasks
- [x] First task
- [ ] Second task
- [x] Third task
`;
      
      const tasks = await extractTasks(mixedTasksMarkdown);
      const currentTask = findCurrentTask(tasks);
      
      expect(currentTask).not.toBeNull();
      expect(currentTask.text).toBe('Second task');
      expect(currentTask.index).toBe(1);
    });
  });
  
  describe('extractTagsFromTask', () => {
    test('extracts single tag from task', async () => {
      const task = {
        text: 'Task with #unit-test tag',
        completed: false,
        index: 0
      };
      
      const tags = extractTagsFromTask(task);
      
      expect(tags).toHaveLength(1);
      expect(tags[0]).toBe('unit-test');
    });
    
    test('extracts multiple tags from task', async () => {
      const task = {
        text: 'Task with multiple tags #e2e-test #update-docs',
        completed: false,
        index: 0
      };
      
      const tags = extractTagsFromTask(task);
      
      expect(tags).toHaveLength(2);
      expect(tags).toContain('e2e-test');
      expect(tags).toContain('update-docs');
    });
    
    test('handles task with no tags', async () => {
      const task = {
        text: 'Task with no tags',
        completed: false,
        index: 0
      };
      
      const tags = extractTagsFromTask(task);
      
      expect(tags).toHaveLength(0);
    });
    
    test('handles tags in the middle of text', async () => {
      const task = {
        text: 'Task with #unit-test tag in the middle',
        completed: false,
        index: 0
      };
      
      const tags = extractTagsFromTask(task);
      
      expect(tags).toHaveLength(1);
      expect(tags[0]).toBe('unit-test');
    });
  });
  
  describe('hasTag', () => {
    test('returns true when task has the tag', async () => {
      const task = {
        text: 'Task with #unit-test tag',
        completed: false,
        index: 0
      };
      
      expect(hasTag(task, 'unit-test')).toBe(true);
    });
    
    test('returns false when task does not have the tag', async () => {
      const task = {
        text: 'Task with #unit-test tag',
        completed: false,
        index: 0
      };
      
      expect(hasTag(task, 'e2e-test')).toBe(false);
    });
    
    test('returns false for task with no tags', async () => {
      const task = {
        text: 'Task with no tags',
        completed: false,
        index: 0
      };
      
      expect(hasTag(task, 'unit-test')).toBe(false);
    });
  });
  
  describe('updateTaskStatus', () => {
    test('updates task status to completed', async () => {
      const originalMarkdown = `# Issue 0001: Test Issue

## Tasks
- [ ] First task
- [ ] Second task
`;
      
      const updatedMarkdown = await updateTaskStatus(originalMarkdown, 0, true);
      
      expect(updatedMarkdown).toContain('- [x] First task');
      expect(updatedMarkdown).toContain('- [ ] Second task');
    });
    
    test('updates task status to uncompleted', async () => {
      const originalMarkdown = `# Issue 0001: Test Issue

## Tasks
- [x] First task
- [ ] Second task
`;
      
      const updatedMarkdown = await updateTaskStatus(originalMarkdown, 0, false);
      
      expect(updatedMarkdown).toContain('- [ ] First task');
      expect(updatedMarkdown).toContain('- [ ] Second task');
    });
    
    test('handles invalid task index', async () => {
      const originalMarkdown = `# Issue 0001: Test Issue

## Tasks
- [ ] First task
- [ ] Second task
`;
      
      await expect(updateTaskStatus(originalMarkdown, 5, true)).rejects.toThrow('Task index out of bounds');
    });
    
    test('preserves other content in the markdown', async () => {
      const originalMarkdown = `# Issue 0001: Test Issue

## Problem to be solved
This is a test issue.

## Tasks
- [ ] First task
- [ ] Second task

## Instructions
Follow these instructions.
`;
      
      const updatedMarkdown = await updateTaskStatus(originalMarkdown, 1, true);
      
      expect(updatedMarkdown).toContain('# Issue 0001: Test Issue');
      expect(updatedMarkdown).toContain('## Problem to be solved');
      expect(updatedMarkdown).toContain('This is a test issue.');
      expect(updatedMarkdown).toContain('## Instructions');
      expect(updatedMarkdown).toContain('Follow these instructions.');
      expect(updatedMarkdown).toContain('- [ ] First task');
      expect(updatedMarkdown).toContain('- [x] Second task');
    });
  });
});