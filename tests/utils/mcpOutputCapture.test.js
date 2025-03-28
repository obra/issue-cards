// ABOUTME: Tests for enhanced output manager with MCP output capturing
// ABOUTME: Verifies always-on output capture and console suppression

const outputManager = require('../../src/utils/outputManager');

describe('MCP Output Capture', () => {
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
    
    // Reset output manager before each test
    outputManager.reset();
    
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

  test('always captures output regardless of configuration', () => {
    // Normal mode - should capture and display
    outputManager.configure({});
    outputManager.success('Success message 1');
    outputManager.info('Info message 1');
    
    // Get captured output
    let output = outputManager.getCapturedOutput();
    
    // Verify output was captured
    expect(output.success).toContain('Success message 1');
    expect(output.info).toContain('Info message 1');
    
    // Verify output was displayed
    expect(stdoutBuffer.length).toBe(2);
    
    // Reset for next test
    outputManager.reset();
    stdoutBuffer = [];
    stderrBuffer = [];
    
    // Configure with suppressConsole - should capture but not display
    outputManager.configure({ suppressConsole: true });
    outputManager.success('Success message 2');
    outputManager.info('Info message 2');
    
    // Get captured output
    output = outputManager.getCapturedOutput();
    
    // Verify output was captured
    expect(output.success).toContain('Success message 2');
    expect(output.info).toContain('Info message 2');
    
    // Verify output was not displayed
    expect(stdoutBuffer.length).toBe(0);
  });
  
  test('supports command context tracking', () => {
    // This will fail because command context tracking doesn't exist yet
    
    // Set command context
    outputManager.setCommandContext('test-command');
    
    // Generate output
    outputManager.success('Command success');
    outputManager.info('Command info');
    
    // Get command-specific output
    const commandOutput = outputManager.getCommandOutput('test-command');
    
    // Verify command output was captured
    expect(commandOutput.success).toContain('Command success');
    expect(commandOutput.info).toContain('Command info');
    
    // Reset command output
    outputManager.resetCommandOutput('test-command');
    
    // Verify command output was reset
    const afterReset = outputManager.getCommandOutput('test-command');
    expect(afterReset).toBeNull();
  });
  
  test('captures structured output data by command', () => {
    // This will fail because command context tracking doesn't exist yet
    
    // Set command context
    outputManager.setCommandContext('list-command');
    
    // Generate structured output
    outputManager.section('ISSUES', ['Issue 1', 'Issue 2']);
    outputManager.list(['Task 1', 'Task 2'], { numbered: true });
    
    // Get command-specific output
    const commandOutput = outputManager.getCommandOutput('list-command');
    
    // Verify structured data was captured correctly
    expect(commandOutput.data).toHaveProperty('ISSUES');
    expect(commandOutput.data.ISSUES).toEqual(['Issue 1', 'Issue 2']);
    expect(commandOutput.data).toHaveProperty('list');
    expect(commandOutput.data.list).toContain('Task 1');
    expect(commandOutput.data.list).toContain('Task 2');
  });
  
  test('supports output format transformation', () => {
    // This will fail because transformation functions don't exist yet
    
    // Generate mixed output
    outputManager.success('Operation completed');
    outputManager.error('With one warning');
    outputManager.section('RESULTS', ['Item 1', 'Item 2']);
    
    // Get captured output
    const output = outputManager.getCapturedOutput();
    
    // Transform to simple format
    const simple = outputManager.toSimpleFormat(output);
    expect(simple).toBeInstanceOf(Array);
    expect(simple.length).toBeGreaterThan(0);
    expect(simple.find(item => item.type === 'success')).toBeTruthy();
    
    // Transform to markdown
    const markdown = outputManager.toMarkdown(output);
    expect(typeof markdown).toBe('string');
    expect(markdown).toContain('## RESULTS');
    expect(markdown).toContain('Item 1');
    expect(markdown).toContain('Item 2');
    expect(markdown).toContain('✅ Operation completed');
  });
  
  test('handles nested command contexts', () => {
    // This will fail because nested command contexts don't exist yet
    
    // Start parent command
    outputManager.setCommandContext('parent');
    outputManager.info('Parent command started');
    
    // Start child command
    outputManager.pushCommandContext('child');
    outputManager.info('Child command started');
    outputManager.success('Child command completed');
    
    // Return to parent context
    outputManager.popCommandContext();
    outputManager.success('Parent command completed');
    
    // Get command outputs
    const childOutput = outputManager.getCommandOutput('child');
    const parentOutput = outputManager.getCommandOutput('parent');
    
    // Verify child output
    expect(childOutput.info).toContain('Child command started');
    expect(childOutput.success).toContain('Child command completed');
    expect(childOutput.info).not.toContain('Parent command started');
    
    // Verify parent output
    expect(parentOutput.info).toContain('Parent command started');
    expect(parentOutput.success).toContain('Parent command completed');
    
    // Check if parent has reference to child output
    expect(parentOutput.children).toContainEqual({
      name: 'child',
      output: childOutput
    });
  });
});