// ABOUTME: Tests for additional MCP tools used for AI integration
// ABOUTME: Verifies functionality of issue management and templating MCP tools

const { executeCommand } = require('../../src/index');

// Mock the output manager
jest.mock('../../src/utils/outputManager', () => {
  const originalModule = jest.requireActual('../../src/utils/outputManager');
  return {
    ...originalModule,
    configure: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    getCommandOutput: jest.fn(),
    resetCommandOutput: jest.fn(),
    reset: jest.fn(),
    transformOutput: jest.fn()
  };
});

// Mock the issue manager functions for core functionality
jest.mock('../../src/utils/issueManager', () => ({
  getIssues: jest.fn(),
  getIssueByNumber: jest.fn(),
  isValidIssueNumber: jest.fn(),
  isValidIssueState: jest.fn(),
  getCurrentIssue: jest.fn(),
  getCurrentTask: jest.fn(),
  addTaskToIssue: jest.fn(),
  getIssueFilePath: jest.fn(),
  closeIssue: jest.fn(),
  completeTask: jest.fn(),
  getNextIssueNumber: jest.fn(),
  saveIssue: jest.fn(),
  getIssue: jest.fn(),
  getTemplates: jest.fn()
}));

// Mock the command execution
jest.mock('../../src/index', () => ({
  executeCommand: jest.fn()
}));

// Mock fs for file operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn().mockResolvedValue(true),
    unlink: jest.fn()
  },
  constants: {
    F_OK: 0
  }
}));

// Mock directory functions
jest.mock('../../src/utils/directory', () => ({
  isInitialized: jest.fn().mockResolvedValue(true),
  getIssueDirectoryPath: jest.fn().mockReturnValue('/mock/path')
}));

// Mock template functions
jest.mock('../../src/utils/template', () => ({
  loadTemplate: jest.fn(),
  renderTemplate: jest.fn(),
  validateTemplate: jest.fn(),
  getTemplateList: jest.fn()
}));

// Mock section manager
jest.mock('../../src/utils/sectionManager', () => ({
  addContentToSection: jest.fn(),
  findSectionByName: jest.fn(),
  normalizeSectionName: jest.fn(name => name)
}));

// Validation is now handled by a separate module, so we'll mock it to always pass
jest.mock('../../src/mcp/validator', () => {
  const validator = jest.fn().mockReturnValue(null);
  return {
    validateArgs: validator,
    withValidation: jest.fn((nameOrFn, fn) => {
      // Handle both function or string+function signature
      return typeof fn === 'function' ? fn : nameOrFn;
    }),
    schemas: {}
  };
});

// Import MCP tools - this should fail until we implement the new tools
const { 
  mcp__createIssue,
  mcp__completeTask,
  mcp__addNote,
  mcp__addQuestion,
  mcp__logFailure,
  mcp__listTemplates,
  mcp__showTemplate
} = require('../../src/mcp/tools');

describe('MCP Additional Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('mcp__createIssue', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__createIssue).toBe('function');
    });
    
    it('should create a new issue when called with valid parameters', async () => {
      // Mock dependencies
      const mockIssueNumber = '0042';
      require('../../src/utils/issueManager').getNextIssueNumber.mockResolvedValue(mockIssueNumber);
      require('../../src/utils/template').validateTemplate.mockResolvedValue(true);
      require('../../src/utils/template').loadTemplate.mockResolvedValue('# Issue {{NUMBER}}: {{TITLE}}\n\n## Problem\n{{PROBLEM}}');
      require('../../src/utils/template').renderTemplate.mockReturnValue('# Issue 0042: Test Issue\n\n## Problem\nTest problem');
      
      // Call the function and verify the result
      const result = await mcp__createIssue({ 
        template: 'feature',
        title: 'Test Issue',
        problem: 'Test problem'
      });
      
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          issueNumber: mockIssueNumber,
          title: 'Test Issue'
        })
      });
      
      expect(require('../../src/utils/issueManager').saveIssue).toHaveBeenCalledWith(
        mockIssueNumber,
        expect.any(String)
      );
    });
    
    it('should validate required parameters', async () => {
      // Call without required title
      const result = await mcp__createIssue({ 
        template: 'feature'
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'ValidationError'
        })
      });
    });
    
    it('should handle errors when template is not found', async () => {
      // Mock validateTemplate to return false
      require('../../src/utils/template').validateTemplate.mockResolvedValue(false);
      
      const result = await mcp__createIssue({ 
        template: 'nonexistent',
        title: 'Test Issue'
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'NotFoundError',
          message: expect.stringContaining('Template')
        })
      });
    });
  });
  
  describe('mcp__completeTask', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__completeTask).toBe('function');
    });
    
    it('should complete the current task when called', async () => {
      // Mock getCurrentIssue and getCurrentTask
      const mockIssue = {
        issueNumber: '0001',
        title: 'Test Issue',
        content: '# Issue 0001: Test Issue\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2'
      };
      
      const mockTask = {
        id: 1,
        index: 0, // First task in the list
        description: 'Task 1',
        completed: false,
        text: 'Task 1'
      };
      
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue(mockIssue);
      require('../../src/utils/taskParser').extractTasks = jest.fn().mockResolvedValue([
        mockTask,
        { id: 2, index: 1, description: 'Task 2', completed: false, text: 'Task 2' }
      ]);
      require('../../src/utils/taskParser').findCurrentTask = jest.fn().mockReturnValue(mockTask);
      require('../../src/utils/taskParser').updateTaskStatus = jest.fn()
        .mockResolvedValue('# Issue 0001: Test Issue\n\n## Tasks\n- [x] Task 1\n- [ ] Task 2');
      
      const result = await mcp__completeTask({});
      
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          taskCompleted: mockTask.text,
          nextTask: expect.objectContaining({
            description: 'Task 2'
          })
        })
      });
      
      expect(require('../../src/utils/issueManager').saveIssue).toHaveBeenCalledWith(
        mockIssue.issueNumber,
        expect.any(String)
      );
    });
    
    it('should handle case when all tasks are completed', async () => {
      // Mock getCurrentIssue and getCurrentTask
      const mockIssue = {
        issueNumber: '0001',
        title: 'Test Issue',
        content: '# Issue 0001: Test Issue\n\n## Tasks\n- [ ] Task 1'
      };
      
      const mockTask = {
        id: 1,
        index: 0,
        description: 'Task 1',
        completed: false,
        text: 'Task 1'
      };
      
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue(mockIssue);
      require('../../src/utils/taskParser').extractTasks = jest.fn()
        .mockResolvedValueOnce([mockTask]) // First call returns the task
        .mockResolvedValueOnce([{ ...mockTask, completed: true }]); // Second call returns completed task
      
      require('../../src/utils/taskParser').findCurrentTask = jest.fn()
        .mockReturnValueOnce(mockTask) // First call returns the task
        .mockReturnValueOnce(null); // Second call returns null (no more tasks)
        
      require('../../src/utils/taskParser').updateTaskStatus = jest.fn()
        .mockResolvedValue('# Issue 0001: Test Issue\n\n## Tasks\n- [x] Task 1');
      
      const result = await mcp__completeTask({});
      
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          taskCompleted: mockTask.text,
          nextTask: null,
          issueCompleted: true
        })
      });
      
      expect(require('../../src/utils/issueManager').closeIssue).toHaveBeenCalledWith(mockIssue.issueNumber);
    });
    
    it('should handle errors when no current task exists', async () => {
      // Mock getCurrentIssue and getCurrentTask to show no current task
      const mockIssue = {
        issueNumber: '0001',
        title: 'Test Issue',
        content: '# Issue 0001: Test Issue\n\n## Tasks\n- [x] Task 1'
      };
      
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue(mockIssue);
      require('../../src/utils/taskParser').extractTasks = jest.fn().mockResolvedValue([
        { id: 1, index: 0, description: 'Task 1', completed: true, text: 'Task 1' }
      ]);
      require('../../src/utils/taskParser').findCurrentTask = jest.fn().mockReturnValue(null);
      
      const result = await mcp__completeTask({});
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'UserError',
          message: expect.stringContaining('No tasks found')
        })
      });
    });
  });
  
  describe('mcp__addNote', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__addNote).toBe('function');
    });
    
    it('should add a note to the specified issue section', async () => {
      // Mock dependencies
      const mockIssue = {
        number: '0001',
        title: 'Test Issue'
      };
      
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue(mockIssue);
      require('../../src/utils/issueManager').getIssue.mockResolvedValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nOriginal problem');
      require('../../src/utils/sectionManager').addContentToSection.mockReturnValue(
        '# Issue 0001: Test Issue\n\n## Problem to be solved\nOriginal problem\nNew note'
      );
      
      const result = await mcp__addNote({ 
        note: 'New note',
        section: 'problem'
      });
      
      expect(result).toEqual({
        success: true,
        data: {
          issueNumber: mockIssue.issueNumber,
          section: 'problem',
          noteAdded: true
        }
      });
      
      // Check that saveIssue was called instead of fs.writeFile
      expect(require('../../src/utils/issueManager').saveIssue).toHaveBeenCalled();
    });
    
    it('should handle specified issue number', async () => {
      // Mock dependencies for specified issue number
      require('../../src/utils/issueManager').getIssue.mockResolvedValue('# Issue 0002: Another Issue\n\n## Problem to be solved\nOriginal problem');
      require('../../src/utils/sectionManager').addContentToSection.mockReturnValue(
        '# Issue 0002: Another Issue\n\n## Problem to be solved\nOriginal problem\nNew note'
      );
      
      const result = await mcp__addNote({ 
        issueNumber: '0002',
        note: 'New note',
        section: 'problem'
      });
      
      expect(result).toEqual({
        success: true,
        data: {
          issueNumber: '0002',
          section: 'problem',
          noteAdded: true
        }
      });
      
      // Check that saveIssue was called with correct issue number
      expect(require('../../src/utils/issueManager').saveIssue).toHaveBeenCalledWith(
        '0002',
        expect.any(String)
      );
    });
    
    it('should handle errors when section is not found', async () => {
      // Mock dependencies to throw section not found error
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue({
        number: '0001',
        title: 'Test Issue'
      });
      require('../../src/utils/issueManager').getIssue.mockResolvedValue('# Issue 0001: Test Issue\n\n## Problem to be solved\nOriginal problem');
      
      // Mock addContentToSection to throw an error
      require('../../src/utils/sectionManager').addContentToSection.mockImplementation(() => {
        throw new Error('Section nonexistent not found');
      });
      
      const result = await mcp__addNote({ 
        note: 'New note',
        section: 'nonexistent'
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'SectionNotFoundError'
        })
      });
    });
  });
  
  describe('mcp__addQuestion', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__addQuestion).toBe('function');
    });
    
    it('should add a question to the current issue', async () => {
      // Mock dependencies
      const mockIssue = {
        number: '0001',
        title: 'Test Issue'
      };
      
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue(mockIssue);
      require('../../src/utils/issueManager').getIssue.mockResolvedValue('# Issue 0001: Test Issue\n\n## Questions to resolve\nExisting question?');
      require('../../src/utils/sectionManager').findSectionByName.mockReturnValue({
        name: 'Questions to resolve',
        content: 'Existing question?'
      });
      require('../../src/utils/sectionManager').addContentToSection.mockReturnValue(
        '# Issue 0001: Test Issue\n\n## Questions to resolve\nExisting question?\nNew question?'
      );
      
      const result = await mcp__addQuestion({ 
        question: 'New question'
      });
      
      expect(result).toEqual({
        success: true,
        data: {
          issueNumber: mockIssue.issueNumber,
          questionAdded: true
        }
      });
      
      // Check that saveIssue was called instead of fs.writeFile
      expect(require('../../src/utils/issueManager').saveIssue).toHaveBeenCalled();
      
      // Verify the question was formatted correctly
      expect(require('../../src/utils/sectionManager').addContentToSection).toHaveBeenCalledWith(
        expect.any(String),
        'Questions to resolve',
        'New question?',
        'question'
      );
    });
    
    it('should handle errors when the Questions section is not found', async () => {
      // Mock dependencies
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue({
        number: '0001',
        title: 'Test Issue'
      });
      require('../../src/utils/issueManager').getIssue.mockResolvedValue('# Issue 0001: Test Issue\n\n## Problem\nProblem description');
      
      // Mock findSectionByName to return null (section not found)
      require('../../src/utils/sectionManager').findSectionByName.mockReturnValue(null);
      
      const result = await mcp__addQuestion({ 
        question: 'New question'
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'SectionNotFoundError',
          message: expect.stringContaining('Questions to resolve')
        })
      });
    });
  });
  
  describe('mcp__logFailure', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__logFailure).toBe('function');
    });
    
    it('should log a failed approach to the current issue', async () => {
      // Mock dependencies
      const mockIssue = {
        number: '0001',
        title: 'Test Issue'
      };
      
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue(mockIssue);
      require('../../src/utils/issueManager').getIssue.mockResolvedValue('# Issue 0001: Test Issue\n\n## Failed approaches\n- Existing approach');
      require('../../src/utils/sectionManager').findSectionByName.mockReturnValue({
        name: 'Failed approaches',
        content: '- Existing approach'
      });
      require('../../src/utils/sectionManager').addContentToSection.mockReturnValue(
        '# Issue 0001: Test Issue\n\n## Failed approaches\n- Existing approach\n- New approach (Reason: It failed)'
      );
      
      const result = await mcp__logFailure({ 
        approach: 'New approach',
        reason: 'It failed'
      });
      
      expect(result).toEqual({
        success: true,
        data: {
          issueNumber: mockIssue.issueNumber,
          approachLogged: true
        }
      });
      
      // Check that saveIssue was called instead of fs.writeFile
      expect(require('../../src/utils/issueManager').saveIssue).toHaveBeenCalled();
      
      expect(require('../../src/utils/sectionManager').addContentToSection).toHaveBeenCalledWith(
        expect.any(String),
        'Failed approaches',
        'New approach',
        'failure',
        expect.objectContaining({ reason: 'It failed' })
      );
    });
    
    it('should handle errors when the Failed approaches section is not found', async () => {
      // Mock dependencies
      require('../../src/utils/issueManager').getCurrentIssue.mockResolvedValue({
        number: '0001',
        title: 'Test Issue'
      });
      require('../../src/utils/issueManager').getIssue.mockResolvedValue('# Issue 0001: Test Issue\n\n## Problem\nProblem description');
      
      // Mock findSectionByName to return null (section not found)
      require('../../src/utils/sectionManager').findSectionByName.mockReturnValue(null);
      
      const result = await mcp__logFailure({ 
        approach: 'New approach',
        reason: 'It failed'
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'SectionNotFoundError',
          message: expect.stringContaining('Failed approaches')
        })
      });
    });
  });
  
  describe('mcp__listTemplates', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__listTemplates).toBe('function');
    });
    
    it('should list available templates of specified type', async () => {
      // Mock the template utility functions
      require('../../src/utils/template').getTemplateList.mockResolvedValue(['feature', 'bugfix', 'refactor']);
      
      const result = await mcp__listTemplates({ type: 'issue' });
      
      expect(result).toEqual({
        success: true,
        data: {
          templates: expect.arrayContaining(['feature', 'bugfix', 'refactor']),
          type: 'issue'
        }
      });
      
      expect(require('../../src/utils/template').getTemplateList).toHaveBeenCalledWith('issue');
    });
    
    it('should list templates for both types when no type specified', async () => {
      // Mock the template utility functions
      require('../../src/utils/template').getTemplateList
        .mockResolvedValueOnce(['feature', 'bugfix', 'refactor']) // First call (issue templates)
        .mockResolvedValueOnce(['unit-test', 'e2e-test']); // Second call (tag templates)
      
      const result = await mcp__listTemplates({});
      
      expect(result).toEqual({
        success: true,
        data: {
          issue: expect.arrayContaining(['feature', 'bugfix', 'refactor']),
          tag: expect.arrayContaining(['unit-test', 'e2e-test'])
        }
      });
      
      expect(require('../../src/utils/template').getTemplateList).toHaveBeenCalledWith('issue');
      expect(require('../../src/utils/template').getTemplateList).toHaveBeenCalledWith('tag');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock getTemplateList to throw an error
      require('../../src/utils/template').getTemplateList.mockRejectedValue(new Error('Failed to list templates'));
      
      const result = await mcp__listTemplates({ type: 'issue' });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('templates')
        })
      });
    });
  });
  
  describe('mcp__showTemplate', () => {
    it('should exist as a function', () => {
      expect(typeof mcp__showTemplate).toBe('function');
    });
    
    it('should show the content of a specified template', async () => {
      // Mock dependencies
      require('../../src/utils/template').validateTemplate.mockResolvedValue(true);
      require('../../src/utils/template').loadTemplate.mockResolvedValue('# Template Title\n\n## Content\nTemplate content here');
      
      const result = await mcp__showTemplate({ 
        name: 'feature',
        type: 'issue'
      });
      
      expect(result).toEqual({
        success: true,
        data: {
          name: 'feature',
          type: 'issue',
          content: '# Template Title\n\n## Content\nTemplate content here'
        }
      });
      
      expect(require('../../src/utils/template').loadTemplate).toHaveBeenCalledWith('feature', 'issue');
    });
    
    it('should handle errors when template is not found', async () => {
      // Mock validateTemplate to return false (template not found)
      require('../../src/utils/template').validateTemplate.mockResolvedValue(false);
      
      const result = await mcp__showTemplate({ 
        name: 'nonexistent',
        type: 'issue'
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'NotFoundError',
          message: expect.stringContaining('Template')
        })
      });
    });
    
    it('should validate required parameters', async () => {
      // Call without required name
      const result = await mcp__showTemplate({ 
        type: 'issue'
      });
      
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          type: 'ValidationError'
        })
      });
    });
  });
});