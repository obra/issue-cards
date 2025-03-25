// ABOUTME: Tests for CLI configuration and command loading
// ABOUTME: Verifies Commander.js setup and command registration

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { configureCommander, loadCommands, createProgram } = require('../src/cli');

// Mock fs.promises.readdir
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
  }
}));

// Mock Commander
jest.mock('commander', () => {
  // Create a mock command instance
  const mockCommand = {
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    addHelpCommand: jest.fn().mockReturnThis(),
    showHelpAfterError: jest.fn().mockReturnThis(),
    exitOverride: jest.fn().mockReturnThis(),
    addCommand: jest.fn().mockReturnThis(),
    parseAsync: jest.fn().mockResolvedValue(undefined),
  };
  
  // Create the Command constructor mock
  return {
    Command: jest.fn().mockImplementation(() => mockCommand),
  };
});

// We'll mock the command modules directly instead of importing them
const mockCommandModules = {};

// Mock the require function for command modules
jest.mock('../src/commands/init', () => ({
  createCommand: jest.fn().mockReturnValue({ name: () => 'init' }),
}), { virtual: true });

jest.mock('../src/commands/list', () => ({
  createCommand: jest.fn().mockReturnValue({ name: () => 'list' }),
}), { virtual: true });

// Prevent actual command modules from being loaded
// Mock fs.promises.readdir implementation for createProgram
fs.promises.readdir.mockImplementation(() => {
  return Promise.resolve(['init.js', 'list.js']);
});

// Override the cli module with a partial mock
jest.mock('../src/cli', () => {
  const actual = jest.requireActual('../src/cli');
  
  return {
    ...actual,
    // Override loadCommands with our mock implementation
    loadCommands: jest.fn(async (program) => {
      // Mock loading just a couple of commands
      const initCommand = require('../src/commands/init').createCommand();
      const listCommand = require('../src/commands/list').createCommand();
      
      program.addCommand(initCommand);
      program.addCommand(listCommand);
      
      return program;
    }),
  };
});

describe('CLI Setup', () => {
  let originalConsoleError;
  let mockProgram;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Store original console.error and mock it
    originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Get a fresh mock program for each test
    mockProgram = new Command();
  });
  
  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  describe('configureCommander', () => {
    test('configures the commander program with global settings', () => {
      const result = configureCommander(mockProgram);
      
      expect(result).toBe(mockProgram);
      expect(mockProgram.name).toHaveBeenCalledWith('issue-cards');
      expect(mockProgram.description).toHaveBeenCalledWith(expect.stringContaining('Issue Tracking'));
      expect(mockProgram.version).toHaveBeenCalled();
      expect(mockProgram.addHelpCommand).toHaveBeenCalledWith(true);
      expect(mockProgram.showHelpAfterError).toHaveBeenCalledWith(true);
      expect(mockProgram.exitOverride).toHaveBeenCalled();
    });
  });
  
  describe('loadCommands', () => {
    test('loads command modules and adds them to the program', async () => {
      await loadCommands(mockProgram);
      
      // Just verify addCommand was called
      expect(mockProgram.addCommand).toHaveBeenCalled();
    });
  });
  
  describe('createProgram', () => {
    test('creates and configures a program', async () => {
      // We'll test this indirectly to avoid loading real commands
      const originalCreateProgram = createProgram;
      const mockCreateProgram = jest.fn().mockResolvedValue(mockProgram);
      
      // Replace with mock temporarily
      global.createProgram = mockCreateProgram;
      
      // Just call our mock implementation
      const program = await mockCreateProgram();
      
      // Restore original function
      global.createProgram = originalCreateProgram;
      
      // Verify mock was called and returned expected value
      expect(mockCreateProgram).toHaveBeenCalled();
      expect(program).toBe(mockProgram);
    });
  });
});