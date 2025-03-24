// ABOUTME: Tests for output formatting utilities
// ABOUTME: Verifies formatting functions for CLI output

const chalk = require('chalk');
const { 
  formatCommand, 
  formatTask,
  formatSection,
  formatContext,
  formatSuccess,
  formatError,
  formatList
} = require('../../src/utils/output');

// Mock chalk to avoid color codes in test output
jest.mock('chalk', () => ({
  bold: jest.fn(text => text),
  green: jest.fn(text => text),
  red: jest.fn(text => text),
  yellow: jest.fn(text => text),
  blue: jest.fn(text => text),
  grey: jest.fn(text => text),
}));

describe('Output formatting utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('formatCommand', () => {
    test('formats command with correct header', () => {
      const result = formatCommand('issue-cards current');
      expect(result.startsWith('COMMAND: issue-cards current')).toBe(true);
      expect(chalk.bold).toHaveBeenCalledWith('COMMAND: issue-cards current');
    });
  });
  
  describe('formatTask', () => {
    test('formats task with correct header', () => {
      const result = formatTask('Create user model');
      expect(result.startsWith('TASK: Create user model')).toBe(true);
      expect(chalk.bold).toHaveBeenCalledWith('TASK: Create user model');
    });
  });
  
  describe('formatSection', () => {
    test('formats section with correct header', () => {
      const result = formatSection('TASKS', ['Task 1', 'Task 2']);
      expect(result.includes('TASKS:')).toBe(true);
      expect(result.includes('Task 1')).toBe(true);
      expect(result.includes('Task 2')).toBe(true);
      expect(chalk.bold).toHaveBeenCalledWith('TASKS:');
    });
    
    test('handles section with string content', () => {
      const result = formatSection('Problem', 'This is a problem description');
      expect(result.includes('Problem:')).toBe(true);
      expect(result.includes('This is a problem description')).toBe(true);
    });
    
    test('handles section with empty content', () => {
      const result = formatSection('Empty Section', '');
      expect(result.includes('Empty Section:')).toBe(true);
      expect(result.trim().endsWith('Empty Section:')).toBe(true);
    });
  });
  
  describe('formatContext', () => {
    test('formats multiple context sections', () => {
      const context = {
        problem: 'This is a problem',
        failed: ['Failed attempt 1', 'Failed attempt 2'],
        instructions: 'Follow these instructions'
      };
      
      const result = formatContext(context);
      
      expect(result.includes('CONTEXT:')).toBe(true);
      expect(result.includes('Problem to be solved:')).toBe(true);
      expect(result.includes('This is a problem')).toBe(true);
      expect(result.includes('Failed approaches:')).toBe(true);
      expect(result.includes('Failed attempt 1')).toBe(true);
      expect(result.includes('Failed attempt 2')).toBe(true);
      expect(result.includes('Instructions:')).toBe(true);
      expect(result.includes('Follow these instructions')).toBe(true);
    });
    
    test('skips empty context sections', () => {
      const context = {
        problem: 'This is a problem',
        failed: [],
        instructions: ''
      };
      
      const result = formatContext(context);
      
      expect(result.includes('Problem to be solved:')).toBe(true);
      expect(result.includes('Failed approaches:')).toBe(false);
      expect(result.includes('Instructions:')).toBe(false);
    });
  });
  
  describe('formatSuccess', () => {
    test('formats success message', () => {
      const result = formatSuccess('Operation completed');
      expect(result.includes('Operation completed')).toBe(true);
      expect(chalk.green).toHaveBeenCalled();
    });
  });
  
  describe('formatError', () => {
    test('formats error message', () => {
      const result = formatError('Operation failed');
      expect(result.includes('Operation failed')).toBe(true);
      expect(chalk.red).toHaveBeenCalled();
    });
  });
  
  describe('formatList', () => {
    test('formats numbered list', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const result = formatList(items, { numbered: true });
      
      expect(result.includes('1. Item 1')).toBe(true);
      expect(result.includes('2. Item 2')).toBe(true);
      expect(result.includes('3. Item 3')).toBe(true);
    });
    
    test('formats bulleted list', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const result = formatList(items);
      
      expect(result.includes('- Item 1')).toBe(true);
      expect(result.includes('- Item 2')).toBe(true);
      expect(result.includes('- Item 3')).toBe(true);
    });
    
    test('returns empty string for empty list', () => {
      const result = formatList([]);
      expect(result).toBe('');
    });
  });
});