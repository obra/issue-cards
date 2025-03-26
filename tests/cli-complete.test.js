// ABOUTME: Comprehensive tests for CLI configuration and command loading
// ABOUTME: Tests all methods and error paths in the CLI setup

// First, save a reference to the original cli module
const originalCliModule = jest.requireActual('../src/cli');

// Mock process.exit to prevent tests from exiting
jest.spyOn(process, 'exit').mockImplementation(() => {});

// Mock fs.promises.readdir
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      ...originalFs.promises,
      readdir: jest.fn().mockResolvedValue([
        'init.js',
        'list.js',
        'create.js',
        'show.js',
        'README.md'  // A non-JS file that will be skipped
      ])
    }
  };
});

// Mock the UserError class
jest.mock('../src/utils/errors', () => {
  const UserErrorMock = jest.fn().mockImplementation(function(message) {
    this.message = message;
    this.withDisplayMessage = jest.fn().mockImplementation((displayMessage) => {
      this.displayMessage = displayMessage;
      return this;
    });
    return this;
  });
  
  return {
    UserError: UserErrorMock,
    SystemError: jest.fn()
  };
});

// We'll use the real command modules but track if their createCommand functions are called
const mockCreateCommandFns = {
  init: jest.fn().mockReturnValue({ name: () => 'init', description: jest.fn() }),
  list: jest.fn().mockReturnValue({ name: () => 'list', description: jest.fn() }),
  create: jest.fn().mockReturnValue({ name: () => 'create', description: jest.fn() }),
  show: jest.fn().mockReturnValue({ name: () => 'show', description: jest.fn() })
};

// Mock the command modules
jest.mock('../src/commands/init', () => ({
  createCommand: mockCreateCommandFns.init
}));

jest.mock('../src/commands/list', () => ({
  createCommand: mockCreateCommandFns.list
}));

jest.mock('../src/commands/create', () => ({
  createCommand: mockCreateCommandFns.create
}));

jest.mock('../src/commands/show', () => ({
  createCommand: mockCreateCommandFns.show
}));

// We'll simulate a non-command JS file in our mock fs readdir
// But we don't need to actually mock the module since our loadCommands function will
// skip files that don't have a createCommand function

// Use the real path module instead of trying to mock it
jest.unmock('path');


// Mock package.json for version
jest.mock('../package.json', () => ({
  version: '1.0.0'
}), { virtual: true });

describe('CLI Module Tests', () => {
  // Get a clean copy of the module under test for each test suite
  let cli;
  
  // Mock command object
  let mockCommand;
  
  // Handler for exitOverride
  let exitHandler;
  
  beforeEach(() => {
    jest.resetModules();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a mock command object
    mockCommand = {
      name: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      version: jest.fn().mockReturnThis(),
      addHelpCommand: jest.fn().mockReturnThis(),
      showHelpAfterError: jest.fn().mockReturnThis(),
      exitOverride: jest.fn(handler => {
        exitHandler = handler;
        return mockCommand;
      }),
      addCommand: jest.fn().mockReturnThis(),
    };
    
    // Mock the Command constructor
    jest.mock('commander', () => ({
      Command: jest.fn().mockImplementation(() => mockCommand)
    }));
    
    // Dynamically require the CLI module to get a fresh instance
    cli = require('../src/cli');
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('configureCommander', () => {
    test('sets up the commander program with correct settings', () => {
      // Get a reference to the real fs module
      const fs = require('fs');
      
      // Call the function under test
      const result = cli.configureCommander(mockCommand);
      
      // Verify the program was configured
      expect(result).toBe(mockCommand);
      expect(mockCommand.name).toHaveBeenCalledWith('issue-cards');
      expect(mockCommand.description).toHaveBeenCalledWith('AI-Optimized Command Line Issue Tracking Tool');
      expect(mockCommand.version).toHaveBeenCalledWith('1.0.0', '-V, --version', 'Output the version number');
      expect(mockCommand.addHelpCommand).toHaveBeenCalledWith(true);
      expect(mockCommand.showHelpAfterError).toHaveBeenCalledWith(true);
      expect(mockCommand.exitOverride).toHaveBeenCalled();
    });
    
    test('exitOverride handler handles help display events', () => {
      // Call the function to set up the exit handler
      cli.configureCommander(mockCommand);
      
      // Create an error with help code
      const helpError = new Error('Help was displayed');
      helpError.code = 'commander.helpDisplayed';
      
      // Call the handler and wrap in try/catch to handle process.exit
      try {
        exitHandler(helpError);
      } catch (error) {
        // This shouldn't happen
        console.error('Unexpected error:', error);
      }
      
      // Verify process.exit was called with 0
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    test('exitOverride handler handles version display events', () => {
      // Call the function to set up the exit handler
      cli.configureCommander(mockCommand);
      
      // Create an error with version code
      const versionError = new Error('Version was displayed');
      versionError.code = 'commander.version';
      
      // Call the handler and wrap in try/catch to handle process.exit
      try {
        exitHandler(versionError);
      } catch (error) {
        // This shouldn't happen
        console.error('Unexpected error:', error);
      }
      
      // Verify process.exit was called with 0
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    test('exitOverride handler throws UserError for unknown commands', () => {
      // Call the function to set up the exit handler
      cli.configureCommander(mockCommand);
      
      // Create an error with unknown command code
      const unknownCommandError = new Error('unknown-command');
      unknownCommandError.code = 'commander.unknownCommand';
      
      // Call the handler and expect it to throw
      try {
        exitHandler(unknownCommandError);
        // Shouldn't reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify error properties
        expect(error.message).toContain('unknown-command');
        expect(error.withDisplayMessage).toHaveBeenCalledWith(expect.stringContaining('unknown-command'));
      }
    });
    
    test('exitOverride handler rethrows other errors', () => {
      // Call the function to set up the exit handler
      cli.configureCommander(mockCommand);
      
      // Create a generic error
      const otherError = new Error('Some other error');
      otherError.code = 'other.code';
      
      // Call the handler and expect it to throw the original error
      let caughtError;
      try {
        exitHandler(otherError);
      } catch (error) {
        caughtError = error;
      }
      
      // Verify the error was thrown through
      expect(caughtError).toBe(otherError);
    });
  });
  
  describe('loadCommands', () => {
    test('loads all JS command modules with createCommand function', async () => {
      // Get a reference to the real fs module
      const fs = require('fs');
      
      // Call the function under test
      await cli.loadCommands(mockCommand);
      
      // Verify fs.promises.readdir was called
      expect(fs.promises.readdir).toHaveBeenCalled();
      
      // Verify createCommand was called for valid modules
      expect(mockCreateCommandFns.init).toHaveBeenCalled();
      expect(mockCreateCommandFns.list).toHaveBeenCalled();
      expect(mockCreateCommandFns.create).toHaveBeenCalled();
      expect(mockCreateCommandFns.show).toHaveBeenCalled();
      
      // Verify addCommand was called for each command
      expect(mockCommand.addCommand).toHaveBeenCalledTimes(4);
    });
  });
  
  describe('createProgram', () => {
    test('creates a new program, configures it, and loads commands', async () => {
      // Get references to Command
      const { Command } = require('commander');
      
      // Call the function under test
      const result = await cli.createProgram();
      
      // Verify a new Command was created
      expect(Command).toHaveBeenCalled();
      
      // Verify the result is the configured program
      expect(result).toBe(mockCommand);
      
      // Verify key commander methods were called
      expect(mockCommand.name).toHaveBeenCalled();
      expect(mockCommand.description).toHaveBeenCalled();
      expect(mockCommand.addCommand).toHaveBeenCalled();
    });
  });
});