// ABOUTME: Tests for task expansion utilities
// ABOUTME: Verifies tag-based expansion of tasks

const {
  expandTask,
  extractTagSteps,
  combineSteps,
  createExpandedTaskList,
  validateTagTemplate,
  getMergedTagSteps
} = require('../../src/utils/taskExpander');
const template = require('../../src/utils/template');
const taskParser = require('../../src/utils/taskParser');

// Mock dependencies
jest.mock('../../src/utils/template', () => ({
  loadTemplate: jest.fn(),
  validateTemplate: jest.fn(),
  getTemplateList: jest.fn(),
}));

jest.mock('../../src/utils/taskParser', () => ({
  extractTagsFromTask: jest.fn(),
}));

describe('Task Expander utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('extractTagSteps', () => {
    test('extracts steps from tag template', async () => {
      // Mock the tag template content
      const mockTemplateContent = `# unit-test

## Steps
- Write failing unit tests
- Run tests and verify they fail
- [ACTUAL TASK GOES HERE]
- Run tests and verify they pass
- Check test coverage
`;
      
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      const steps = await extractTagSteps('unit-test');
      
      expect(steps).toHaveLength(5);
      expect(steps[0]).toBe('Write failing unit tests');
      expect(steps[2]).toBe('[ACTUAL TASK GOES HERE]');
      expect(steps[4]).toBe('Check test coverage');
      
      expect(template.loadTemplate).toHaveBeenCalledWith('unit-test', 'tag');
    });
    
    test('returns empty array when template has no steps section', async () => {
      // Mock a template with no steps section
      const mockTemplateContent = `# unit-test

Some content without a Steps section.
`;
      
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      const steps = await extractTagSteps('unit-test');
      
      expect(steps).toHaveLength(0);
    });
    
    test('handles template loading errors', async () => {
      // Mock a template loading error
      template.loadTemplate.mockRejectedValue(new Error('Template not found'));
      
      const steps = await extractTagSteps('nonexistent-tag');
      
      expect(steps).toHaveLength(0);
    });
    
    test('extracts placeholders for step parameters', async () => {
      // Mock a template with placeholders
      const mockTemplateContent = `# unit-test

## Steps
- Write failing unit tests for {{component}}
- Run tests and verify they fail
- [ACTUAL TASK GOES HERE]
- Run tests and verify they pass
`;
      
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      
      const { steps, placeholders } = await extractTagSteps('unit-test', true);
      
      expect(steps).toHaveLength(4);
      expect(steps[0]).toBe('Write failing unit tests for {{component}}');
      expect(placeholders).toHaveLength(1);
      expect(placeholders).toContain('component');
    });
  });
  
  describe('combineSteps', () => {
    test('combines task with tag steps', () => {
      const task = 'Implement feature X';
      const tagSteps = [
        'Write failing unit tests',
        'Run tests and verify they fail',
        '[ACTUAL TASK GOES HERE]',
        'Run tests and verify they pass',
        'Check test coverage'
      ];
      
      const combinedSteps = combineSteps(task, tagSteps);
      
      expect(combinedSteps).toHaveLength(5);
      expect(combinedSteps[0]).toBe('Write failing unit tests');
      expect(combinedSteps[1]).toBe('Run tests and verify they fail');
      expect(combinedSteps[2]).toBe('Implement feature X');
      expect(combinedSteps[3]).toBe('Run tests and verify they pass');
      expect(combinedSteps[4]).toBe('Check test coverage');
    });
    
    test('returns original task when tag steps are empty', () => {
      const task = 'Implement feature X';
      
      const combinedSteps = combineSteps(task, []);
      
      expect(combinedSteps).toHaveLength(1);
      expect(combinedSteps[0]).toBe('Implement feature X');
    });
    
    test('handles tag steps without placeholder', () => {
      const task = 'Implement feature X';
      const tagSteps = [
        'First step',
        'Second step',
        'Third step'
      ];
      
      const combinedSteps = combineSteps(task, tagSteps);
      
      expect(combinedSteps).toHaveLength(4);
      expect(combinedSteps[0]).toBe('First step');
      expect(combinedSteps[1]).toBe('Second step');
      expect(combinedSteps[2]).toBe('Third step');
      expect(combinedSteps[3]).toBe('Implement feature X');
    });
    
    test('handles placeholders in steps', () => {
      const task = 'Implement feature X';
      const tagSteps = [
        'Write tests for {{component}}',
        '[ACTUAL TASK GOES HERE]',
        'Update docs for {{component}}'
      ];
      const placeholders = { component: 'TaskManager' };
      
      const combinedSteps = combineSteps(task, tagSteps, placeholders);
      
      expect(combinedSteps).toHaveLength(3);
      expect(combinedSteps[0]).toBe('Write tests for TaskManager');
      expect(combinedSteps[1]).toBe('Implement feature X');
      expect(combinedSteps[2]).toBe('Update docs for TaskManager');
    });
  });
  
  describe('expandTask', () => {
    test('expands task with single tag', async () => {
      // Mock extractTagsFromTask to return a single tag
      taskParser.extractTagsFromTask.mockReturnValue([{name: 'unit-test', params: {}}]);
      
      // Mock the tag template content
      const mockTemplateContent = `# unit-test

## Steps
- Write failing unit tests
- Run tests and verify they fail
- [ACTUAL TASK GOES HERE]
- Run tests and verify they pass
- Check test coverage
`;
      
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      template.validateTemplate.mockResolvedValue(true);
      
      const task = { text: 'Implement feature X #unit-test', completed: false, index: 0 };
      
      const expandedSteps = await expandTask(task);
      
      expect(expandedSteps).toHaveLength(5);
      expect(expandedSteps[0]).toBe('Write failing unit tests');
      expect(expandedSteps[1]).toBe('Run tests and verify they fail');
      expect(expandedSteps[2]).toBe('Implement feature X');
      expect(expandedSteps[3]).toBe('Run tests and verify they pass');
      expect(expandedSteps[4]).toBe('Check test coverage');
      
      expect(taskParser.extractTagsFromTask).toHaveBeenCalledWith(task);
      expect(template.validateTemplate).toHaveBeenCalledWith('unit-test', 'tag');
      expect(template.loadTemplate).toHaveBeenCalledWith('unit-test', 'tag');
    });
    
    test('expands task with multiple tags', async () => {
      // Mock extractTagsFromTask to return multiple tags
      taskParser.extractTagsFromTask.mockReturnValue([
        {name: 'unit-test', params: {}},
        {name: 'update-docs', params: {}}
      ]);
      
      // Mock tag templates
      const unitTestTemplate = `# unit-test

## Steps
- Write unit tests
- [ACTUAL TASK GOES HERE]
- Run unit tests
`;
      
      const updateDocsTemplate = `# update-docs

## Steps
- [ACTUAL TASK GOES HERE]
- Update documentation
- Update comments
`;
      
      // Mock template loading based on tag name
      template.loadTemplate.mockImplementation((tag) => {
        if (tag === 'unit-test') return Promise.resolve(unitTestTemplate);
        if (tag === 'update-docs') return Promise.resolve(updateDocsTemplate);
        return Promise.resolve('');
      });
      
      template.validateTemplate.mockResolvedValue(true);
      
      const task = { 
        text: 'Implement feature X #unit-test #update-docs', 
        completed: false, 
        index: 0 
      };
      
      const expandedSteps = await expandTask(task);
      
      // Should combine steps from both tags
      expect(expandedSteps.length).toBeGreaterThan(1);
      expect(expandedSteps).toContain('Write unit tests');
      expect(expandedSteps).toContain('Run unit tests');
      expect(expandedSteps).toContain('Update documentation');
      expect(expandedSteps).toContain('Update comments');
      expect(expandedSteps).toContain('Implement feature X');
    });
    
    test('returns original task for task without tags', async () => {
      // Mock extractTagsFromTask to return no tags
      taskParser.extractTagsFromTask.mockReturnValue([]);
      
      const task = { text: 'Implement feature X', completed: false, index: 0 };
      
      const expandedSteps = await expandTask(task);
      
      expect(expandedSteps).toHaveLength(1);
      expect(expandedSteps[0]).toBe('Implement feature X');
      
      expect(taskParser.extractTagsFromTask).toHaveBeenCalledWith(task);
      expect(template.validateTemplate).not.toHaveBeenCalled();
      expect(template.loadTemplate).not.toHaveBeenCalled();
    });
    
    test('handles invalid tag templates', async () => {
      // Mock extractTagsFromTask to return a tag
      taskParser.extractTagsFromTask.mockReturnValue([{name: 'nonexistent-tag', params: {}}]);
      
      // Mock validateTemplate to return false (tag doesn't exist)
      template.validateTemplate.mockResolvedValue(false);
      
      const task = { text: 'Implement feature X #nonexistent-tag', completed: false, index: 0 };
      
      const expandedSteps = await expandTask(task);
      
      // Should just return the original task text
      expect(expandedSteps).toHaveLength(1);
      expect(expandedSteps[0]).toBe('Implement feature X');
      
      expect(taskParser.extractTagsFromTask).toHaveBeenCalledWith(task);
      expect(template.validateTemplate).toHaveBeenCalledWith('nonexistent-tag', 'tag');
      expect(template.loadTemplate).not.toHaveBeenCalled();
    });
    
    test('handles tag parameters', async () => {
      // Mock a task with tag parameters
      taskParser.extractTagsFromTask.mockReturnValue([{name: 'unit-test', params: {component: 'UserService'}}]);
      
      // Mock tag template with placeholders
      const mockTemplateContent = `# unit-test

## Steps
- Write failing unit tests for {{component}}
- Run tests and verify they fail
- [ACTUAL TASK GOES HERE]
- Run tests and verify they pass
`;
      
      template.loadTemplate.mockResolvedValue(mockTemplateContent);
      template.validateTemplate.mockResolvedValue(true);
      
      const task = { 
        text: 'Implement feature X #unit-test(component=UserService)', 
        completed: false, 
        index: 0 
      };
      
      const expandedSteps = await expandTask(task);
      
      expect(expandedSteps).toHaveLength(4);
      expect(expandedSteps[0]).toBe('Write failing unit tests for UserService');
      expect(expandedSteps[1]).toBe('Run tests and verify they fail');
      expect(expandedSteps[2]).toBe('Implement feature X');
      expect(expandedSteps[3]).toBe('Run tests and verify they pass');
    });
  });
  
  describe('validateTagTemplate', () => {
    test('validates tag template structure', async () => {
      // Valid template with Steps section and placeholder
      const validTemplate = `# unit-test

## Steps
- First step
- [ACTUAL TASK GOES HERE]
- Third step
`;
      template.loadTemplate.mockResolvedValue(validTemplate);
      
      const result = await validateTagTemplate('unit-test');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('reports missing Steps section', async () => {
      const invalidTemplate = `# unit-test

Some content but no Steps section
`;
      template.loadTemplate.mockResolvedValue(invalidTemplate);
      
      const result = await validateTagTemplate('unit-test');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template must have a Steps section');
    });
    
    test('reports missing task placeholder', async () => {
      const invalidTemplate = `# unit-test

## Steps
- First step
- Second step
- Third step
`;
      template.loadTemplate.mockResolvedValue(invalidTemplate);
      
      const result = await validateTagTemplate('unit-test');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template must have a [ACTUAL TASK GOES HERE] placeholder in Steps');
    });
    
    test('handles template loading errors', async () => {
      template.loadTemplate.mockRejectedValue(new Error('Template not found'));
      
      const result = await validateTagTemplate('nonexistent-tag');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template not found');
    });
  });
  
  describe('getMergedTagSteps', () => {
    test('merges steps from multiple tags', async () => {
      const tags = ['unit-test', 'update-docs'];
      
      // Mock tag templates
      const unitTestTemplate = `# unit-test

## Steps
- Write unit tests
- [ACTUAL TASK GOES HERE]
- Run unit tests
`;
      
      const updateDocsTemplate = `# update-docs

## Steps
- [ACTUAL TASK GOES HERE]
- Update API documentation
- Update README
`;
      
      // Mock template loading
      template.loadTemplate.mockImplementation((tag) => {
        if (tag === 'unit-test') return Promise.resolve(unitTestTemplate);
        if (tag === 'update-docs') return Promise.resolve(updateDocsTemplate);
        return Promise.reject(new Error('Template not found'));
      });
      
      template.validateTemplate.mockResolvedValue(true);
      
      const mergedSteps = await getMergedTagSteps(tags);
      
      expect(mergedSteps).toHaveLength(5);
      expect(mergedSteps).toContain('Write unit tests');
      expect(mergedSteps).toContain('[ACTUAL TASK GOES HERE]');
      expect(mergedSteps).toContain('Run unit tests');
      expect(mergedSteps).toContain('Update API documentation');
      expect(mergedSteps).toContain('Update README');
    });
    
    test('handles invalid tags', async () => {
      const tags = ['valid-tag', 'invalid-tag'];
      
      // Mock template loading and validation
      template.loadTemplate.mockImplementation((tag) => {
        if (tag === 'valid-tag') {
          return Promise.resolve(`# valid-tag\n\n## Steps\n- First step\n- [ACTUAL TASK GOES HERE]\n- Third step`);
        }
        return Promise.reject(new Error('Template not found'));
      });
      
      template.validateTemplate.mockImplementation((tag) => {
        return Promise.resolve(tag === 'valid-tag');
      });
      
      const mergedSteps = await getMergedTagSteps(tags);
      
      expect(mergedSteps).toHaveLength(3);
      expect(mergedSteps).toContain('First step');
      expect(mergedSteps).toContain('[ACTUAL TASK GOES HERE]');
      expect(mergedSteps).toContain('Third step');
    });
    
    test('returns empty array for no valid tags', async () => {
      const tags = ['invalid-tag1', 'invalid-tag2'];
      
      template.validateTemplate.mockResolvedValue(false);
      
      const mergedSteps = await getMergedTagSteps(tags);
      
      expect(mergedSteps).toHaveLength(0);
    });
  });
  
  describe('createExpandedTaskList', () => {
    test('creates list of tasks with expansions', async () => {
      const tasks = [
        { text: 'Task 1', completed: false, index: 0 },
        { text: 'Task 2 #unit-test', completed: false, index: 1 },
        { text: 'Task 3', completed: true, index: 2 }
      ];
      
      // Mock tasks without and with tags
      taskParser.extractTagsFromTask.mockImplementation((task) => {
        if (task.text.includes('#unit-test')) return ['unit-test'];
        return [];
      });
      
      // Mock template loading
      const unitTestTemplate = `# unit-test

## Steps
- Write unit tests
- [ACTUAL TASK GOES HERE]
- Run unit tests
`;
      
      template.loadTemplate.mockResolvedValue(unitTestTemplate);
      template.validateTemplate.mockResolvedValue(true);
      
      const expandedList = await createExpandedTaskList(tasks);
      
      expect(expandedList).toHaveLength(3);
      
      // First task should not be expanded
      expect(expandedList[0].originalTask).toEqual(tasks[0]);
      expect(expandedList[0].expandedSteps).toHaveLength(1);
      expect(expandedList[0].expandedSteps[0]).toBe('Task 1');
      
      // Second task should be expanded
      expect(expandedList[1].originalTask).toEqual(tasks[1]);
      expect(expandedList[1].expandedSteps).toHaveLength(3);
      expect(expandedList[1].expandedSteps[0]).toBe('Write unit tests');
      expect(expandedList[1].expandedSteps[1]).toBe('Task 2');
      expect(expandedList[1].expandedSteps[2]).toBe('Run unit tests');
      
      // Third task should not be expanded
      expect(expandedList[2].originalTask).toEqual(tasks[2]);
      expect(expandedList[2].expandedSteps).toHaveLength(1);
      expect(expandedList[2].expandedSteps[0]).toBe('Task 3');
    });
    
    test('handles empty task list', async () => {
      const expandedList = await createExpandedTaskList([]);
      expect(expandedList).toHaveLength(0);
    });
  });
});