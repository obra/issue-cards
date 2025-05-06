// Test for documentation structure

const { execSync } = require('child_process');
const path = require('path');

describe('Documentation structure', () => {
  const runCommand = (cmd) => {
    try {
      return execSync(cmd, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../')
      });
    } catch (error) {
      console.error(error.stdout);
      console.error(error.stderr);
      throw error;
    }
  };

  test('help command returns basic documentation categories', () => {
    const output = runCommand('node ./src/index.js help');
    
    // Verify core categories appear in the output
    expect(output).toContain('General');
    expect(output).toContain('Commands');
    
    // Verify all documentation files appear
    expect(output).toContain('quick-start');
    expect(output).toContain('workflows');
    expect(output).toContain('task-management');
    expect(output).toContain('ai-integration');
    expect(output).toContain('contributing');
    expect(output).toContain('env');
  });

  test('accessing a specific documentation file works', () => {
    const output = runCommand('node ./src/index.js help quick-start');
    
    // Check that the quick start content is shown
    expect(output).toContain('Quick Start Guide');
    expect(output).toContain('Installation');
    expect(output).toContain('Initialize Issue Tracking');
    expect(output).toContain('Create Your First Issue');
  });
});