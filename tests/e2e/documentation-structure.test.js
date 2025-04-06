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

  test('help command returns all documentation categories', () => {
    const output = runCommand('node ./src/index.js help');
    
    // Verify all categories appear in the output
    expect(output).toContain('Tutorials');
    expect(output).toContain('Guides');
    expect(output).toContain('Reference');
    expect(output).toContain('Design');
    
    // Verify some specific files appear
    expect(output).toContain('tutorials/basic-workflow');
    expect(output).toContain('guides/git-integration');
    expect(output).toContain('reference/tag-expansion');
    expect(output).toContain('design/index');
  });

  test('accessing a specific documentation file works', () => {
    const output = runCommand('node ./src/index.js help tutorials/index');
    
    // Check that the tutorial index content is shown
    expect(output).toContain('Tutorials');
    expect(output).toContain('Available Tutorials');
    expect(output).toContain('Basic Workflow');
    expect(output).toContain('Advanced Features');
    expect(output).toContain('Task Management');
  });
});