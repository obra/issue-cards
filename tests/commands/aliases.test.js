// ABOUTME: Tests for command aliases
// ABOUTME: Verifies that command aliases are correctly implemented

// Import dependencies
const { Command } = require('commander');
const completeTask = require('../../src/commands/completeTask');
const addTask = require('../../src/commands/addTask');
const addQuestion = require('../../src/commands/addQuestion');
const logFailure = require('../../src/commands/logFailure');

describe('Command Aliases', () => {
  test('complete-task command has "complete" alias', () => {
    // Create the command
    const command = completeTask.createCommand();
    
    // Get the command instance
    const commandInstance = command;
    
    // Check the alias is set
    // Note: Commander doesn't expose a public API to check aliases
    // so we need to access the internal structure
    expect(commandInstance._aliases).toContain('complete');
  });
  
  test('add-task command has "add" alias', () => {
    // Create the command
    const command = addTask.createCommand();
    
    // Get the command instance
    const commandInstance = command;
    
    // Check the alias is set
    expect(commandInstance._aliases).toContain('add');
  });
  
  test('add-question command has "question" alias', () => {
    // Create the command
    const command = addQuestion.createCommand();
    
    // Get the command instance
    const commandInstance = command;
    
    // Check the alias is set
    expect(commandInstance._aliases).toContain('question');
  });
  
  test('log-failure command has "failure" alias', () => {
    // Create the command
    const command = logFailure.createCommand();
    
    // Get the command instance
    const commandInstance = command;
    
    // Check the alias is set
    expect(commandInstance._aliases).toContain('failure');
  });
});