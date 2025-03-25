// ABOUTME: End-to-end tests for CLI execution
// ABOUTME: Tests CLI behavior using child_process.execSync

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('CLI Execution', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-cli-exec-'));
    
    // Path to the binary
    binPath = path.resolve(__dirname, '../../bin/issue-cards.js');
    
    // Make sure the binary is executable
    try {
      fs.chmodSync(binPath, '755');
    } catch (error) {
      console.warn(`Could not chmod binary: ${error.message}`);
    }
  });

  afterAll(() => {
    // Restore the original environment
    if (originalIssuesDir) {
      process.env.ISSUE_CARDS_DIR = originalIssuesDir;
    } else {
      delete process.env.ISSUE_CARDS_DIR;
    }
    
    // Clean up the test directory
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error cleaning up test directory: ${error.message}`);
    }
  });

  beforeEach(() => {
    // Set environment variable for tests
    process.env.ISSUE_CARDS_DIR = path.join(testDir, '.issues');
    
    // Clear the .issues directory before each test
    const issuesDir = path.join(testDir, '.issues');
    if (fs.existsSync(issuesDir)) {
      fs.rmSync(issuesDir, { recursive: true, force: true });
    }
  });

  // Test help output
  test('help output', () => {
    const output = execSync(`node ${binPath} --help`, {
      cwd: testDir,
      encoding: 'utf8',
      env: { ...process.env }
    });
    
    // Verify help output contains expected sections
    expect(output).toContain('Usage:');
    expect(output).toContain('Options:');
    expect(output).toContain('Commands:');
    
    // Verify all commands are listed
    expect(output).toContain('create');
    expect(output).toContain('init');
    expect(output).toContain('list');
    expect(output).toContain('show');
    expect(output).toContain('current');
    expect(output).toContain('complete-task');
    expect(output).toContain('add-task');
    expect(output).toContain('add-note');
    expect(output).toContain('add-question');
    expect(output).toContain('log-failure');
    expect(output).toContain('templates');
  });

  // Test version command
  test('version command', () => {
    // Using try/catch since version outputs to stderr
    try {
      execSync(`node ${binPath} --version`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env }
      });
    } catch (error) {
      // Version is output to stderr but it still returns a non-zero exit code
      const output = error.message;
      // Verify version matches semver pattern
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    }
  });

  // Test command help
  test('command help output', () => {
    const output = execSync(`node ${binPath} create --help`, {
      cwd: testDir,
      encoding: 'utf8',
      env: { ...process.env }
    });
    
    // Verify command help output
    expect(output).toContain('Usage: issue-cards create');
    expect(output).toContain('<template>');
    expect(output).toContain('Options:');
  });

  // Test error handling for unknown commands
  test('unknown command handling', () => {
    try {
      execSync(`node ${binPath} unknown-command`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env }
      });
      fail('Should have thrown an error');
    } catch (error) {
      // Verify error message
      expect(error.stderr).toContain('unknown command');
    }
  });
});