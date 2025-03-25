// ABOUTME: Tests for the output manager module
// ABOUTME: Verifies proper output formatting and stream handling

const { mockConsole } = require('./testHelpers');
const outputManager = require('../../src/utils/outputManager');

describe('Output Manager', () => {
  let consoleCapture;
  
  beforeEach(() => {
    consoleCapture = mockConsole();
  });
  
  afterEach(() => {
    consoleCapture.cleanup();
  });
  
  describe('Verbosity Levels', () => {
    test('respects quiet mode', () => {
      outputManager.configure({ quiet: true });
      
      outputManager.success('Success message');
      outputManager.info('Info message');
      outputManager.section('Section', 'Content');
      
      // Only errors should be displayed in quiet mode
      expect(consoleCapture.stdout()).toHaveLength(0);
      
      // Errors should still be displayed
      outputManager.error('Error message');
      expect(consoleCapture.stderr()).toHaveLength(1);
    });
    
    test('debug output only appears in debug mode', () => {
      // Normal mode
      outputManager.configure({ quiet: false, debug: false });
      
      outputManager.debug('Debug message 1');
      expect(consoleCapture.stderr()).toHaveLength(0);
      
      // Debug mode
      outputManager.configure({ quiet: false, debug: true });
      
      outputManager.debug('Debug message 2');
      expect(consoleCapture.stderr()).toHaveLength(1);
      expect(consoleCapture.stderr()[0]).toContain('Debug message 2');
    });
  });
  
  describe('Output Formatting', () => {
    test('success output is formatted correctly', () => {
      outputManager.success('Task completed');
      
      expect(consoleCapture.stdout()).toHaveLength(1);
      expect(consoleCapture.stdout()[0]).toContain('✅ Task completed');
    });
    
    test('error output is formatted correctly', () => {
      outputManager.error('Something went wrong');
      
      expect(consoleCapture.stderr()).toHaveLength(1);
      expect(consoleCapture.stderr()[0]).toContain('❌ Something went wrong');
    });
    
    test('section output is formatted correctly', () => {
      outputManager.section('TASKS', ['Task 1', 'Task 2']);
      
      expect(consoleCapture.stdout()).toHaveLength(1);
      expect(consoleCapture.stdout()[0]).toContain('TASKS:');
      expect(consoleCapture.stdout()[0]).toContain('Task 1');
      expect(consoleCapture.stdout()[0]).toContain('Task 2');
    });
  });
  
  describe('Output Streams', () => {
    test('success messages go to stdout', () => {
      outputManager.success('Success message');
      
      expect(consoleCapture.stdout()).toHaveLength(1);
      expect(consoleCapture.stderr()).toHaveLength(0);
    });
    
    test('error messages go to stderr', () => {
      outputManager.error('Error message');
      
      expect(consoleCapture.stdout()).toHaveLength(0);
      expect(consoleCapture.stderr()).toHaveLength(1);
    });
    
    test('info messages go to stdout', () => {
      outputManager.info('Info message');
      
      expect(consoleCapture.stdout()).toHaveLength(1);
      expect(consoleCapture.stderr()).toHaveLength(0);
    });
    
    test('warning messages go to stderr', () => {
      outputManager.warn('Warning message');
      
      expect(consoleCapture.stdout()).toHaveLength(0);
      expect(consoleCapture.stderr()).toHaveLength(1);
    });
  });
  
  describe('JSON Output', () => {
    test('success output is formatted as JSON when enabled', () => {
      outputManager.configure({ jsonOutput: true });
      
      outputManager.success('Task completed');
      
      expect(consoleCapture.stdout()).toHaveLength(1);
      const output = JSON.parse(consoleCapture.stdout()[0]);
      expect(output).toEqual({
        type: 'success',
        message: 'Task completed'
      });
    });
    
    test('section output is formatted as JSON when enabled', () => {
      outputManager.configure({ jsonOutput: true });
      
      outputManager.section('TASKS', ['Task 1', 'Task 2']);
      
      expect(consoleCapture.stdout()).toHaveLength(1);
      const output = JSON.parse(consoleCapture.stdout()[0]);
      expect(output).toEqual({
        type: 'section',
        title: 'TASKS',
        content: ['Task 1', 'Task 2']
      });
    });
  });
});