// ABOUTME: Unit tests for context extraction utility
// ABOUTME: Tests extracting relevant context from issue content

const { extractContext, getContextForTask, getRelevantSections } = require('../../src/utils/contextExtractor');
const { getSections } = require('../../src/utils/sectionManager');
const { extractTasks } = require('../../src/utils/taskParser');

// Mock dependencies
jest.mock('../../src/utils/taskParser', () => ({
  extractTasks: jest.fn()
}));

jest.mock('../../src/utils/sectionManager', () => ({
  getSections: jest.fn()
}));

describe('Context Extractor', () => {
  const mockContent = 'Test content';
  
  // Common mocks
  const mockTasks = [
    { text: 'Task 1', completed: false, index: 0 },
    { text: 'Task 2', completed: false, index: 1 },
    { text: 'Task with keyword', completed: false, index: 2 }
  ];

  const mockSections = [
    { name: 'Problem to be solved', content: 'Test problem with keyword' },
    { name: 'Planned approach', content: 'Test approach' },
    { name: 'Failed approaches', content: '### Failed attempt\nApproach 1 with keyword\n\n**Reason:** Reason 1' },
    { name: 'Questions to resolve', content: '- [ ] Question about keyword?\n- [x] Another question?' },
    { name: 'Instructions', content: 'Test instructions contain keyword' },
    { name: 'Next steps', content: 'Next step 1' }
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Default mock setup for most tests
    getSections.mockReturnValue(mockSections);
    extractTasks.mockResolvedValue(mockTasks);
  });

  describe('extractContext', () => {
    it('extracts context from issue content', async () => {
      // Call function
      const context = await extractContext('Test content');

      // Verify results - now just the raw section content
      expect(context).toEqual({
        tasks: mockTasks,
        'Problem to be solved': 'Test problem with keyword',
        'Planned approach': 'Test approach',
        'Failed approaches': '### Failed attempt\nApproach 1 with keyword\n\n**Reason:** Reason 1',
        'Questions to resolve': '- [ ] Question about keyword?\n- [x] Another question?',
        'Instructions': 'Test instructions contain keyword',
        'Next steps': 'Next step 1'
      });

      // Verify mocks were called correctly
      expect(getSections).toHaveBeenCalledWith('Test content');
      expect(extractTasks).toHaveBeenCalledWith('Test content');
    });

    it('handles empty content and missing sections', async () => {
      // Mock empty issue
      getSections.mockReturnValue([]);
      extractTasks.mockResolvedValue([]);

      // Call function
      const context = await extractContext('');

      // Verify results - should just be an object with tasks
      expect(context).toEqual({
        tasks: []
      });
    });
  });

  describe('getContextForTask', () => {
    it('finds context containing a specific task', async () => {
      // Call function
      const context = await getContextForTask('Test content', 'Task 1');

      // Should return full context plus the specific task
      expect(context).toHaveProperty('tasks');
      expect(context).toHaveProperty('task');
      expect(context.task).toEqual(mockTasks[0]);
      
      // Should include all section content
      expect(context['Problem to be solved']).toBe('Test problem with keyword');
      expect(context['Instructions']).toBe('Test instructions contain keyword');
    });

    it('returns null if task is not found', async () => {
      // Call function with non-existent task
      const context = await getContextForTask('Test content', 'Non-existent task');

      // Should return null
      expect(context).toBeNull();
    });
  });

  describe('getRelevantSections', () => {
    it('finds sections containing keyword', async () => {
      // Call function
      const relevantSections = await getRelevantSections('Test content', 'keyword');

      // Should return only sections containing the keyword
      expect(relevantSections).toHaveProperty('Problem to be solved');
      expect(relevantSections).toHaveProperty('Failed approaches');
      expect(relevantSections).toHaveProperty('Questions to resolve');
      expect(relevantSections).toHaveProperty('Instructions');
      
      // Should not include sections without the keyword
      expect(relevantSections).not.toHaveProperty('Planned approach');
      expect(relevantSections).not.toHaveProperty('Next steps');
    });

    it('returns empty object if no sections contain keyword', async () => {
      // Call function with keyword not in any section
      const relevantSections = await getRelevantSections('Test content', 'nonexistent');

      // Should return empty object (except potentially tasks, which are handled separately)
      expect(Object.keys(relevantSections).filter(key => key !== 'tasks')).toHaveLength(0);
    });
  });
});