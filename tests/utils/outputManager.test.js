// ABOUTME: Tests for the output manager module
// ABOUTME: Verifies proper output formatting and stream handling

const outputManager = require('../../src/utils/outputManager');

describe('Output Manager', () => {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  // Capture buffers
  let stdoutBuffer = [];
  let stderrBuffer = [];
  
  beforeEach(() => {
    // Reset buffers
    stdoutBuffer = [];
    stderrBuffer = [];
    
    // Reset configuration
    outputManager.configure({
      quiet: false,
      verbose: false,
      debug: false,
      jsonOutput: false
    });
    
    // Mock console methods
    console.log = jest.fn((...args) => {
      stdoutBuffer.push(args[0]);
    });
    
    console.error = jest.fn((...args) => {
      stderrBuffer.push(args[0]);
    });
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  describe('Verbosity Levels', () => {
    test('respects quiet mode', () => {
      outputManager.configure({ quiet: true });
      
      outputManager.success('Success message');
      outputManager.info('Info message');
      outputManager.section('Section', 'Content');
      
      // Only errors should be displayed in quiet mode
      expect(stdoutBuffer).toHaveLength(0);
      
      // Errors should still be displayed
      outputManager.error('Error message');
      expect(stderrBuffer).toHaveLength(1);
    });
    
    test('debug output only appears in debug mode', () => {
      // Normal mode
      outputManager.configure({ quiet: false, debug: false });
      
      outputManager.debug('Debug message 1');
      expect(stderrBuffer).toHaveLength(0);
      
      // Debug mode
      outputManager.configure({ quiet: false, debug: true });
      
      outputManager.debug('Debug message 2');
      expect(stderrBuffer).toHaveLength(1);
      expect(stderrBuffer[0]).toContain('Debug message 2');
    });
  });
  
  describe('Output Formatting', () => {
    test('success output is formatted correctly', () => {
      outputManager.success('Task completed');
      
      expect(stdoutBuffer).toHaveLength(1);
      expect(stdoutBuffer[0]).toContain('✅ Task completed');
    });
    
    test('error output is formatted correctly', () => {
      outputManager.error('Something went wrong');
      
      expect(stderrBuffer).toHaveLength(1);
      expect(stderrBuffer[0]).toContain('❌ Something went wrong');
    });
    
    test('section output is formatted correctly', () => {
      outputManager.section('TASKS', ['Task 1', 'Task 2']);
      
      expect(stdoutBuffer).toHaveLength(1);
      expect(stdoutBuffer[0]).toContain('TASKS:');
      expect(stdoutBuffer[0]).toContain('Task 1');
      expect(stdoutBuffer[0]).toContain('Task 2');
    });
  });
  
  describe('Output Streams', () => {
    test('success messages go to stdout', () => {
      outputManager.success('Success message');
      
      expect(stdoutBuffer).toHaveLength(1);
      expect(stderrBuffer).toHaveLength(0);
    });
    
    test('error messages go to stderr', () => {
      outputManager.error('Error message');
      
      expect(stdoutBuffer).toHaveLength(0);
      expect(stderrBuffer).toHaveLength(1);
    });
    
    test('info messages go to stdout', () => {
      outputManager.info('Info message');
      
      expect(stdoutBuffer).toHaveLength(1);
      expect(stderrBuffer).toHaveLength(0);
    });
    
    test('warning messages go to stderr', () => {
      outputManager.warn('Warning message');
      
      expect(stdoutBuffer).toHaveLength(0);
      expect(stderrBuffer).toHaveLength(1);
    });
  });
  
  describe('JSON Output', () => {
    test('success output is formatted as JSON when enabled', () => {
      // Debug output - console.log preserved for debugging
      originalConsoleLog('Before configure:', JSON.stringify(outputManager.VERBOSITY));
      
      // Setting JSON output mode
      outputManager.configure({ json: true });
      
      // Output a success message
      outputManager.success('Task completed');
      
      // Debug captured output
      originalConsoleLog('Captured stdout:', JSON.stringify(stdoutBuffer));
      
      expect(stdoutBuffer).toHaveLength(1);
      expect(stdoutBuffer[0]).toMatch(/^\{"type":"success"/);
      const output = JSON.parse(stdoutBuffer[0]);
      expect(output).toEqual({
        type: 'success',
        message: 'Task completed'
      });
    });
    
    test('section output is formatted as JSON when enabled', () => {
      // Setting JSON output mode
      outputManager.configure({ json: true });
      
      // Output a section
      outputManager.section('TASKS', ['Task 1', 'Task 2']);
      
      // Debug captured output
      originalConsoleLog('Captured stdout for section:', JSON.stringify(stdoutBuffer));
      
      expect(stdoutBuffer).toHaveLength(1);
      expect(stdoutBuffer[0]).toMatch(/^\{"type":"section"/);
      const output = JSON.parse(stdoutBuffer[0]);
      expect(output).toEqual({
        type: 'section',
        title: 'TASKS',
        content: ['Task 1', 'Task 2']
      });
    });
  });
});