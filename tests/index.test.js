// ABOUTME: Tests for main entry point
// ABOUTME: Verifies application startup and error handling

const main = require('../src/index');
const cli = require('../src/cli');

// Mock cli.createProgram
jest.mock('../src/cli', () => ({
  createProgram: jest.fn(),
}));

describe('Main Entry Point', () => {
  let originalConsoleError;
  let originalProcessExit;
  let mockProgram;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.error
    originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock process.exit
    originalProcessExit = process.exit;
    process.exit = jest.fn();
    
    // Mock program with parseAsync
    mockProgram = {
      parseAsync: jest.fn(),
    };
    
    // Set up successful mock for createProgram
    cli.createProgram.mockResolvedValue(mockProgram);
  });
  
  afterEach(() => {
    // Restore mocks
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });
  
  test('successfully runs the CLI application', async () => {
    await main();
    
    expect(cli.createProgram).toHaveBeenCalled();
    expect(mockProgram.parseAsync).toHaveBeenCalledWith(process.argv);
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });
  
  test('handles errors from createProgram', async () => {
    // Set up error mock for createProgram
    const testError = new Error('Program creation error');
    cli.createProgram.mockRejectedValue(testError);
    
    await main();
    
    expect(cli.createProgram).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('❌ Unexpected error: Program creation error');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('handles errors from parseAsync', async () => {
    // Set up error mock for parseAsync
    const testError = new Error('Parse error');
    mockProgram.parseAsync.mockRejectedValue(testError);
    
    await main();
    
    expect(cli.createProgram).toHaveBeenCalled();
    expect(mockProgram.parseAsync).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('❌ Unexpected error: Parse error');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});