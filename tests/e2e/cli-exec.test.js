// ABOUTME: End-to-end tests for CLI execution
// ABOUTME: Tests CLI behavior using child_process.execSync

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runQuietly, expectCommand } = require('./e2eHelpers');

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
    const { stdout } = runQuietly(`node ${binPath} --help`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify help output contains expected sections
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Options:');
    expect(stdout).toContain('Commands:');
    
    // Verify all commands are listed
    expect(stdout).toContain('create');
    expect(stdout).toContain('init');
    expect(stdout).toContain('list');
    expect(stdout).toContain('show');
    expect(stdout).toContain('current');
    expect(stdout).toContain('complete-task');
    expect(stdout).toContain('add-task');
    expect(stdout).toContain('add-note');
    expect(stdout).toContain('add-question');
    expect(stdout).toContain('log-failure');
    expect(stdout).toContain('templates');
  });

  // Test version command
  test('version command', () => {
    const result = runQuietly(`node ${binPath} --version`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Check for version output (could be in stdout or stderr)
    const output = result.stdout || result.stderr || '';
    
    // Verify version matches semver pattern
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  // Test command help
  test('command help output', () => {
    const { stdout } = runQuietly(`node ${binPath} create --help`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify command help output
    expect(stdout).toContain('Usage: issue-cards create');
    expect(stdout).toContain('<template>');
    expect(stdout).toContain('Options:');
  });

  // Test error handling for unknown commands
  test('unknown command handling', () => {
    const result = runQuietly(`node ${binPath} unknown-command`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should have a non-zero status
    expect(result.status).not.toBe(0);
    
    // Verify error message
    expect(result.stderr).toContain('unknown command');
  });
});