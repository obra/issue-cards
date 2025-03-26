// ABOUTME: Direct tests for CLI configuration
// ABOUTME: Tests command line interface handling

// Just testing the main config function without complex mocking
// Simple direct test for the configureCommander function

jest.mock('../package.json', () => ({ version: '1.0.0' }));

describe('CLI configureCommander', () => {
  let cli;
  let mockProgram;
  
  beforeEach(() => {
    jest.resetModules();
    
    // Mock commander program
    mockProgram = {
      name: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      version: jest.fn().mockReturnThis(),
      addHelpCommand: jest.fn().mockReturnThis(),
      showHelpAfterError: jest.fn().mockReturnThis(),
      exitOverride: jest.fn().mockReturnThis()
    };
    
    // Load CLI module
    cli = require('../src/cli');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('configures commander with correct settings', () => {
    const result = cli.configureCommander(mockProgram);
    
    expect(result).toBe(mockProgram);
    expect(mockProgram.name).toHaveBeenCalledWith('issue-cards');
    expect(mockProgram.description).toHaveBeenCalledWith('AI-Optimized Command Line Issue Tracking Tool');
    expect(mockProgram.version).toHaveBeenCalledWith('1.0.0', '-V, --version', 'Output the version number');
    expect(mockProgram.addHelpCommand).toHaveBeenCalledWith(true);
    expect(mockProgram.showHelpAfterError).toHaveBeenCalledWith(true);
    expect(mockProgram.exitOverride).toHaveBeenCalled();
  });
});