// ABOUTME: E2E tests for CLI command error handling
// ABOUTME: Tests error cases in CLI commands, including error propagation

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runQuietly } = require('./e2eHelpers');

describe('CLI Command Errors E2E', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-cli-errors-'));
    
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

  // Test unknown command handling
  test('unknown command handling', () => {
    // Initialize first
    const initResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(initResult.status).toBe(0);
    
    // Test unknown command
    const result = runQuietly(`node ${binPath} nonexistent-command`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should fail with specific error message
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Unknown command');
  });

  // Test command with missing required arguments
  test('command with missing required arguments', () => {
    // Initialize first
    const initResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(initResult.status).toBe(0);
    
    // Test create without required title
    const result = runQuietly(`node ${binPath} create feature`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should fail with error about missing title
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('title is required');
    expect(result.stderr).toContain('--title');
  });

  // Test multiple invalid options 
  test('command with multiple invalid options', () => {
    // Initialize first
    const initResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(initResult.status).toBe(0);
    
    // Test with multiple unknown options
    const result = runQuietly(`node ${binPath} create feature --unknown1 value --unknown2 value --title "Test"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should fail with unknown option error
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('unknown option');
  });

  // Test invalid issue reference
  test('invalid issue reference', () => {
    // Initialize first
    const initResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(initResult.status).toBe(0);
    
    // Try to show a non-existent issue
    const result = runQuietly(`node ${binPath} show --issue 9999`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should fail with issue not found error
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Issue #9999 not found');
  });

  // Test corrupted issue file
  test('corrupted issue file handling', () => {
    // Initialize first
    runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Create an issue
    runQuietly(`node ${binPath} create feature --title "Test Issue"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Corrupt the issue file
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    fs.writeFileSync(issueFile, 'Corrupted content without proper markdown sections');
    
    // Try to read the corrupted issue
    const result = runQuietly(`node ${binPath} show 1`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should either fail gracefully or show partial content
    if (result.status !== 0) {
      // If it fails, it should have a helpful error message
      expect(result.stderr).toBeTruthy();
    } else {
      // If it succeeds, it should show something
      expect(result.stdout).toBeTruthy();
    }
  });

  // Test exitOverride behavior with help and version
  test('exitOverride behavior with help', () => {
    // Test help flag
    const helpResult = runQuietly(`node ${binPath} --help`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should exit cleanly with status 0
    expect(helpResult.status).toBe(0);
    expect(helpResult.stdout).toContain('Usage:');
  });

  // Test command chaining with invalid commands
  test('command chaining with invalid commands', () => {
    // Initialize first
    runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Create an issue but with an invalid follow-up command
    const createResult = runQuietly(`node ${binPath} create feature --title "Test Issue" --invalid-option`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should fail with unknown option error
    expect(createResult.status).not.toBe(0);
    expect(createResult.stderr).toContain('unknown option');
    
    // Check if the issue was still created despite the error
    const listResult = runQuietly(`node ${binPath} list`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Issue should NOT be created when command fails
    expect(listResult.stdout).not.toContain('Test Issue');
  });
});