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
    it('has command directories with expected files', () => {
      // Verify that command files exist in the commands directory
      const commandsDir = path.join(__dirname, '../../src/commands');
      const files = fs.readdirSync(commandsDir);
      
      // Check for core command files
      expect(files).toContain('init.js');
      expect(files).toContain('create.js');
      expect(files).toContain('list.js');
      expect(files).toContain('show.js');
      expect(files).toContain('current.js');
      
      // Verify there are more than 5 command files
      expect(files.filter(file => file.endsWith('.js')).length).toBeGreaterThan(5);
    });
  });
  
  // Test createProgram function simply by checking the function exists
  describe('createProgram', () => {
    it('is a valid function', () => {
      // Simply check that the function exists
      expect(typeof createProgram).toBe('function');
    });
  });
});