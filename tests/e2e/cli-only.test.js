// ABOUTME: End-to-end tests specifically for the CLI module
// ABOUTME: Tests the configureCommander and loadCommands functions

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const { configureCommander, loadCommands, createProgram } = require('../../src/cli');

describe('CLI Module', () => {
  // Test configureCommander function
  describe('configureCommander', () => {
    it('configures commander with correct settings', () => {
      // Create a commander instance
      const program = new Command();
      
      // Configure it with our function
      const configured = configureCommander(program);
      
      // Verify configuration
      expect(configured.name()).toBe('issue-cards');
      expect(configured._description).toBe('AI-Optimized Command Line Issue Tracking Tool');
      expect(configured._helpCommandName).toBe('help');
      expect(configured._helpShortFlag).toBe('-h');
      expect(configured._helpLongFlag).toBe('--help');
    });
  });
  
  // Test loadCommands function
  describe('loadCommands', () => {
    it('loads all commands from commands directory', async () => {
      // Create a mock program
      const program = new Command();
      const addCommandSpy = jest.spyOn(program, 'addCommand');
      
      // Load commands
      await loadCommands(program);
      
      // Verify commands were added
      // We expect at least these core commands
      const commandNames = addCommandSpy.mock.calls.map(call => call[0].name());
      
      expect(commandNames).toContain('init');
      expect(commandNames).toContain('create');
      expect(commandNames).toContain('list');
      expect(commandNames).toContain('show');
      expect(commandNames).toContain('current');
      
      // Verify more than 5 commands were loaded (we know there are more)
      expect(addCommandSpy).toHaveBeenCalledTimes(expect.any(Number));
      expect(addCommandSpy.mock.calls.length).toBeGreaterThan(5);
    });
  });
  
  // Test createProgram function
  describe('createProgram', () => {
    it('creates a fully configured program', async () => {
      // Create the program
      const program = await createProgram();
      
      // Verify it has the expected properties
      expect(program.name()).toBe('issue-cards');
      expect(program._description).toBe('AI-Optimized Command Line Issue Tracking Tool');
      
      // Verify commands were added (at least one)
      expect(program.commands.length).toBeGreaterThan(0);
    });
  });
});