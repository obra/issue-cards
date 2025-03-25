// ABOUTME: Tests for the custom error classes
// ABOUTME: Verifies error formatting and exit codes

const {
  IssueCardsError,
  UserError,
  SystemError,
  InternalError,
  UninitializedError,
  IssueNotFoundError,
  TemplateNotFoundError,
  SectionNotFoundError
} = require('../../src/utils/errors');

describe('Error Classes', () => {
  describe('Base IssueCardsError', () => {
    test('has correct properties', () => {
      const error = new IssueCardsError('Test error');
      
      expect(error.name).toBe('IssueCardsError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(1);
      expect(error.recoveryHint).toBe('');
    });
    
    test('allows custom exit code', () => {
      const error = new IssueCardsError('Custom code error', 42);
      
      expect(error.code).toBe(42);
    });
    
    test('supports recovery hints', () => {
      const error = new IssueCardsError('Error with hint').withRecoveryHint('Try this instead');
      
      expect(error.recoveryHint).toBe('Try this instead');
    });
  });
  
  describe('Specific Error Types', () => {
    test('UserError has correct code', () => {
      const error = new UserError('Invalid input');
      
      expect(error.name).toBe('UserError');
      expect(error.code).toBe(2);
    });
    
    test('SystemError has correct code', () => {
      const error = new SystemError('File system error');
      
      expect(error.name).toBe('SystemError');
      expect(error.code).toBe(3);
    });
    
    test('InternalError has correct code', () => {
      const error = new InternalError('Unexpected state');
      
      expect(error.name).toBe('InternalError');
      expect(error.code).toBe(4);
    });
  });
  
  describe('Application-Specific Errors', () => {
    test('UninitializedError has correct message and hint', () => {
      const error = new UninitializedError();
      
      expect(error.name).toBe('UninitializedError');
      expect(error.message).toBe('Issue tracking is not initialized');
      expect(error.recoveryHint).toBe('Run `issue-cards init` first');
    });
    
    test('IssueNotFoundError includes issue number', () => {
      const error = new IssueNotFoundError('1234');
      
      expect(error.name).toBe('IssueNotFoundError');
      expect(error.message).toBe('Issue #1234 not found');
    });
    
    test('TemplateNotFoundError includes template name', () => {
      const error = new TemplateNotFoundError('custom-template');
      
      expect(error.name).toBe('TemplateNotFoundError');
      expect(error.message).toBe('Template not found: custom-template');
    });
    
    test('SectionNotFoundError includes section name', () => {
      const error = new SectionNotFoundError('Custom Section');
      
      expect(error.name).toBe('SectionNotFoundError');
      expect(error.message).toBe('Section "Custom Section" not found in issue');
    });
  });
});