// ABOUTME: End-to-end tests for MCP output capturing
// ABOUTME: Verifies that output is captured correctly in real command executions

const outputManager = require('../../src/utils/outputManager');

describe('MCP Output Capture E2E', () => {
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
    // Generate output
    outputManager.success('Success message');
    outputManager.info('Info message');
    outputManager.warn('Warning message');
    
    // Check output is captured
    const output = outputManager.getCapturedOutput();
    expect(output.success).toContain('Success message');
    expect(output.info).toContain('Info message');
    expect(output.warning).toContain('Warning message');
    
    // Verify appropriate output was sent to the console
    expect(stdoutBuffer.length).toBe(2); // success and info
    expect(stderrBuffer.length).toBe(1); // warning
  });
  
  test('supports command context tracking', () => {
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
  
  test('suppresses console output when requested', () => {
    // Configure with suppressConsole
    outputManager.configure({ suppressConsole: true });
    
    // Generate output
    outputManager.success('Success message');
    outputManager.info('Info message');
    
    // Verify output was still captured
    const output = outputManager.getCapturedOutput();
    expect(output.success).toContain('Success message');
    expect(output.info).toContain('Info message');
    
    // Verify console output was suppressed
    expect(stdoutBuffer.length).toBe(0);
    expect(stderrBuffer.length).toBe(0);
  });
  
  test('transforms output to different formats', () => {
    // Generate varied output
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
    expect(successMessages.length).toBeGreaterThan(0);
    
    // Transform to markdown
    const markdown = outputManager.toMarkdown(output);
    expect(typeof markdown).toBe('string');
    expect(markdown).toContain('## RESULTS');
    expect(markdown).toContain('Item 1');
    expect(markdown).toContain('## Success');
    expect(markdown).toContain('✅ Operation completed');
  });
  
  test('handles nested command execution', () => {
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
    const childOutput = outputManager.getCommandOutput('child');
    const parentOutput = outputManager.getCommandOutput('parent');
    
    // Verify child output
    expect(childOutput.info).toContain('Child command started');
    expect(childOutput.success).toContain('Child command completed');
    expect(childOutput.info).not.toContain('Parent command started');
    
    // Verify parent output
    expect(parentOutput.info).toContain('Parent command started');
    expect(parentOutput.success).toContain('Parent command completed');
    
    // Verify parent has reference to child
    expect(parentOutput.children).toContainEqual({
      name: 'child',
      output: expect.objectContaining({
        info: expect.arrayContaining(['Child command started']),
        success: expect.arrayContaining(['Child command completed'])
      })
    });
  });
});