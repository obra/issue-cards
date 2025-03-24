// ABOUTME: Tests for task expansion utilities
// ABOUTME: Verifies tag-based expansion of tasks

const {
  expandTask,
  extractTagSteps,
  combineSteps
} = require('../../src/utils/taskExpander');
const template = require('../../src/utils/template');
const taskParser = require('../../src/utils/taskParser');

// Mock dependencies
jest.mock('../../src/utils/template', () => ({
  loadTemplate: jest.fn(),
  validateTemplate: jest.fn(),
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
  });
  
  describe('expandTask', () => {
    test('expands task with single tag', async () => {
      // Mock extractTagsFromTask to return a single tag
      taskParser.extractTagsFromTask.mockReturnValue(['unit-test']);
      
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
      taskParser.extractTagsFromTask.mockReturnValue(['unit-test', 'update-docs']);
      
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
      taskParser.extractTagsFromTask.mockReturnValue(['nonexistent-tag']);
      
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
  });
});