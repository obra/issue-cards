// Test for enhanced command help texts

// Import src files directly to check for addHelpText
const fs = require('fs');
const path = require('path');

describe('Enhanced command help texts', () => {
  const commandFiles = [
    'create.js',
    'list.js',
    'show.js',
    'current.js',
    'completeTask.js',
    'addTask.js',
    'addNote.js',
    'addQuestion.js',
    'logFailure.js',
    'templates.js',
    'serve.js'
  ];
  
  test('Command files should include addHelpText calls', () => {
    for (const file of commandFiles) {
      const filePath = path.join(__dirname, '../../src/commands', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if the file contains addHelpText
      expect(content).toContain('addHelpText');
      
      // Check if the file contains standard help text sections
      expect(content).toContain('Description:');
      expect(content).toContain('Examples:');
    }
  });
});