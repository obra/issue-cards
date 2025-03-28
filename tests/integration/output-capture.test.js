// ABOUTME: Integration tests for output capturing with real commands
// ABOUTME: Verifies output capture functionality works with actual CLI commands

const outputManager = require('../../src/utils/outputManager');

describe('Output Capturing Integration Tests', () => {
  beforeEach(() => {
    // Reset output manager before each test
    outputManager.reset();
  });
  
  test('captures output in command context', () => {
    // Set command context
    outputManager.setCommandContext('test-command');
    
    // Generate various types of output
    outputManager.success('Success message');
    outputManager.info('Info message');
    outputManager.warn('Warning message');
    outputManager.error('Error message');
    outputManager.section('TEST SECTION', ['Item 1', 'Item 2']);
    outputManager.list(['List item 1', 'List item 2']);
    outputManager.table([
      ['Header 1', 'Header 2'],
      ['Value 1', 'Value 2'],
      ['Value 3', 'Value 4']
    ], { header: true });
    outputManager.raw('Raw output');
    
    // Get command-specific output
    const commandOutput = outputManager.getCommandOutput('test-command');
    
    // Verify all output types were captured
    expect(commandOutput.success).toContain('Success message');
    expect(commandOutput.info).toContain('Info message');
    expect(commandOutput.warning).toContain('Warning message');
    expect(commandOutput.error.some(e => e.message === 'Error message')).toBe(true);
    expect(commandOutput.data['TEST SECTION']).toEqual(['Item 1', 'Item 2']);
    expect(commandOutput.data.list).toContain('List item 1');
    expect(commandOutput.data.list).toContain('List item 2');
    expect(commandOutput.data.table).toHaveLength(1);
    expect(commandOutput.raw).toContain('Raw output');
  });
  
  test('captures output with console suppression', () => {
    // Save original console methods
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    // Capture buffers
    let stdoutBuffer = [];
    let stderrBuffer = [];
    
    // Mock console methods
    console.log = jest.fn((...args) => {
      stdoutBuffer.push(args[0]);
    });
    
    console.error = jest.fn((...args) => {
      stderrBuffer.push(args[0]);
    });
    
    try {
      // With console output
      outputManager.configure({ suppressConsole: false });
      outputManager.success('Should appear in console');
      outputManager.info('Should also appear in console');
      
      // Should have console output
      expect(stdoutBuffer.length).toBe(2);
      
      // Reset buffers
      stdoutBuffer = [];
      stderrBuffer = [];
      
      // With suppressed console
      outputManager.configure({ suppressConsole: true });
      outputManager.success('Should not appear in console');
      outputManager.error('Should not appear in console either');
      
      // Should not have console output
      expect(stdoutBuffer.length).toBe(0);
      expect(stderrBuffer.length).toBe(0);
      
      // But should still be captured
      const output = outputManager.getCapturedOutput();
      expect(output.success).toContain('Should not appear in console');
      expect(output.error.some(e => e.message === 'Should not appear in console either')).toBe(true);
    } finally {
      // Restore console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  });
  
  test('supports nested command contexts', () => {
    // Set parent command context
    outputManager.setCommandContext('parent');
    outputManager.info('Parent command started');
    
    // Push child command context
    outputManager.pushCommandContext('child');
    outputManager.info('Child command started');
    outputManager.success('Child command completed');
    
    // Pop back to parent context
    outputManager.popCommandContext();
    outputManager.success('Parent command completed');
    
    // Get command outputs
    const parentOutput = outputManager.getCommandOutput('parent');
    const childOutput = outputManager.getCommandOutput('child');
    
    // Verify parent output
    expect(parentOutput.info).toContain('Parent command started');
    expect(parentOutput.success).toContain('Parent command completed');
    
    // Verify child output
    expect(childOutput.info).toContain('Child command started');
    expect(childOutput.success).toContain('Child command completed');
    
    // Verify parent has reference to child
    expect(parentOutput.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'child',
          output: expect.objectContaining({
            info: expect.arrayContaining(['Child command started']),
            success: expect.arrayContaining(['Child command completed'])
          })
        })
      ])
    );
  });
  
  test('transforms output to different formats', () => {
    // Generate mixed output
    outputManager.success('Operation completed');
    outputManager.info('With details');
    outputManager.section('RESULTS', ['Item 1', 'Item 2']);
    outputManager.table([
      ['Name', 'Status'],
      ['Task A', 'Done'],
      ['Task B', 'Pending']
    ], { header: true });
    
    // Get captured output
    const output = outputManager.getCapturedOutput();
    
    // Transform to simple format
    const simpleOutput = outputManager.toSimpleFormat(output);
    expect(simpleOutput).toBeInstanceOf(Array);
    expect(simpleOutput.length).toBeGreaterThan(0);
    
    // Find success messages
    const successMessages = simpleOutput.filter(item => item.type === 'success');
    expect(successMessages.length).toBe(1);
    expect(successMessages[0].message).toBe('Operation completed');
    
    // Find section content
    const sectionItem = simpleOutput.find(item => item.type === 'section' && item.title === 'RESULTS');
    expect(sectionItem).toBeDefined();
    expect(sectionItem.content).toEqual(['Item 1', 'Item 2']);
    
    // Transform to markdown
    const markdown = outputManager.toMarkdown(output);
    expect(typeof markdown).toBe('string');
    expect(markdown).toContain('## RESULTS');
    expect(markdown).toContain('Item 1');
    expect(markdown).toContain('## Success');
    expect(markdown).toContain('✅ Operation completed');
    
    // Table should be formatted as markdown table
    expect(markdown).toMatch(/\|\s*Name\s*\|\s*Status\s*\|/);
    expect(markdown).toMatch(/\|\s*Task A\s*\|\s*Done\s*\|/);
  });
  
  test('resets output and configuration', () => {
    // Configure and generate output
    outputManager.configure({ suppressConsole: true });
    outputManager.success('Test message');
    outputManager.section('TEST', ['Item']);
    
    // Reset
    outputManager.reset();
    
    // Verify configuration was reset
    outputManager.success('Should appear in console');
    
    // Save original console methods
    const originalConsoleLog = console.log;
    let stdoutCalled = false;
    
    // Mock console methods
    console.log = jest.fn(() => {
      stdoutCalled = true;
    });
    
    try {
      // Generate output
      outputManager.success('Another test');
      
      // Should have console output after reset
      expect(stdoutCalled).toBe(true);
    } finally {
      // Restore console methods
      console.log = originalConsoleLog;
    }
    
    // Verify captured output was cleared
    const output = outputManager.getCapturedOutput();
    expect(output.success).not.toContain('Test message');
    expect(output.data).not.toHaveProperty('TEST');
  });
});