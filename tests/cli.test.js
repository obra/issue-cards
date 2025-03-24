// ABOUTME: Tests for the CLI command loading and parsing
// ABOUTME: Verifies command registration and execution

const { Command } = require('commander');
const { configureCommander, loadCommands, createProgram } = require('../src/cli');

// Mock commander
jest.mock('commander', () => {
  const mockCommand = {
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    addHelpCommand: jest.fn().mockReturnThis(),
    showHelpAfterError: jest.fn().mockReturnThis(),
    exitOverride: jest.fn(function(cb) {
      this._exitCallback = cb;
      return this;
    }),
    command: jest.fn().mockReturnThis(),
    action: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    alias: jest.fn().mockReturnThis(),
    usage: jest.fn().mockReturnThis(),
    parse: jest.fn(),
    addCommand: jest.fn(),
    help: jest.fn()
  };
  
  return {
    Command: jest.fn(() => mockCommand),
    mockCommand
  };
});

// Mock files in the commands directory
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn().mockResolvedValue(['init.js', 'create.js', 'list.js', 'current.js']),
  }
}));

// Mock command modules
jest.mock('../src/commands/init', () => ({
  createCommand: jest.fn().mockReturnValue({
    name: 'init',
    description: 'Initialize issue tracking in this project',
    action: jest.fn()
  })
}), { virtual: true });

jest.mock('../src/commands/create', () => ({
  createCommand: jest.fn().mockReturnValue({
    name: 'create',
    description: 'Create a new issue from template',
    action: jest.fn()
  })
}), { virtual: true });

jest.mock('../src/commands/list', () => ({
  createCommand: jest.fn().mockReturnValue({
    name: 'list',
    description: 'List all open issues',
    action: jest.fn()
  })
}), { virtual: true });

jest.mock('../src/commands/current', () => ({
  createCommand: jest.fn().mockReturnValue({
    name: 'current',
    description: 'Show current task with context',
    action: jest.fn()
  })
}), { virtual: true });

describe('CLI', () => {
  const { mockCommand } = require('commander');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('configureCommander', () => {
    test('configures commander with correct settings', () => {
      const program = mockCommand;
      
      configureCommander(program);
      
      expect(program.name).toHaveBeenCalledWith('issue-cards');
      expect(program.description).toHaveBeenCalled();
      expect(program.version).toHaveBeenCalled();
      expect(program.addHelpCommand).toHaveBeenCalledWith(true);
      expect(program.showHelpAfterError).toHaveBeenCalledWith(true);
      expect(program.exitOverride).toHaveBeenCalled();
    });
  });
  
  describe('loadCommands', () => {
    test('loads all command modules and registers them', async () => {
      const program = mockCommand;
      const mockAddCommand = jest.fn();
      program.addCommand = mockAddCommand;
      
      await loadCommands(program);
      
      // Should have loaded 4 commands (init, create, list, current)
      expect(mockAddCommand).toHaveBeenCalledTimes(4);
      
      // Verify each command was loaded
      const commandModules = [
        require('../src/commands/init'),
        require('../src/commands/create'),
        require('../src/commands/list'),
        require('../src/commands/current')
      ];
      
      for (const module of commandModules) {
        expect(module.createCommand).toHaveBeenCalled();
      }
    });
  });
  
  describe('createProgram', () => {
    test('creates and configures program', async () => {
      const program = await createProgram();
      
      expect(program).toBe(mockCommand);
      expect(program.name).toHaveBeenCalledWith('issue-cards');
      expect(program.addCommand).toHaveBeenCalledTimes(4);
    });
  });
});