// ABOUTME: Tests for main entry point
// ABOUTME: Verifies application startup and error handling

const main = require('../src/index');
const cli = require('../src/cli');
const { IssueCardsError } = require('../src/utils/errors');

// Mock outputManager
jest.mock('../src/utils/outputManager', () => ({
  configure: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  success: jest.fn()
}));

// Mock cli.createProgram
jest.mock('../src/cli', () => ({
  createProgram: jest.fn(),
}));

describe('Main Entry Point', () => {
  let originalProcessExit;
  let mockProgram;
  let outputManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get reference to outputManager mock
    outputManager = require('../src/utils/outputManager');
    
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
    process.exit = originalProcessExit;
  });
  
  test('successfully runs the CLI application', async () => {
    await main();
    
    expect(cli.createProgram).toHaveBeenCalled();
    expect(mockProgram.parseAsync).toHaveBeenCalledWith(process.argv);
    expect(outputManager.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });
  
  test('handles errors from createProgram', async () => {
    // Set up error mock for createProgram
    const testError = new Error('Program creation error');
    cli.createProgram.mockRejectedValue(testError);
    
    await main();
    
    expect(cli.createProgram).toHaveBeenCalled();
    expect(outputManager.error).toHaveBeenCalledWith('Unexpected error: Program creation error');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('handles errors from parseAsync', async () => {
    // Set up error mock for parseAsync
    const testError = new Error('Parse error');
    mockProgram.parseAsync.mockRejectedValue(testError);
    
    await main();
    
    expect(cli.createProgram).toHaveBeenCalled();
    expect(mockProgram.parseAsync).toHaveBeenCalled();
    expect(outputManager.error).toHaveBeenCalledWith('Unexpected error: Parse error');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('handles IssueCardsError with display message', async () => {
    // Create a custom error with display message
    const customError = new IssueCardsError('Internal error');
    customError.withDisplayMessage('User-friendly error message');
    customError.code = 2; // Set a custom exit code
    
    mockProgram.parseAsync.mockRejectedValue(customError);
    
    await main();
    
    expect(outputManager.error).toHaveBeenCalledWith('User-friendly error message');
    expect(process.exit).toHaveBeenCalledWith(2);
  });
  
  test('handles IssueCardsError without display message', async () => {
    // Create a custom error without display message but with recovery hint
    const customError = new IssueCardsError('Internal error');
    customError.withRecoveryHint('Try again later');
    customError.code = 3; // Set a custom exit code
    
    mockProgram.parseAsync.mockRejectedValue(customError);
    
    await main();
    
    expect(outputManager.error).toHaveBeenCalledWith('Internal error (Try again later)');
    expect(process.exit).toHaveBeenCalledWith(3);
  });
  
  test('prevents duplicate error display', async () => {
    // Create a custom error that was already displayed
    const customError = new IssueCardsError('Internal error');
    customError.withDisplayMessage('Already displayed error');
    customError.markDisplayed(); // Mark as already displayed
    customError.code = 4; // Set a custom exit code
    
    mockProgram.parseAsync.mockRejectedValue(customError);
    
    await main();
    
    // Should not call error method again
    expect(outputManager.error).not.toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(4);
  });
});