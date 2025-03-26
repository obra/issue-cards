// ABOUTME: End-to-end tests for output manager functionality
// ABOUTME: Tests the different output formats and styles used by commands

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runQuietly } = require('./e2eHelpers');

describe('Output Manager E2E', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-output-manager-'));
    
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
    
    // Initialize
    runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
  });

  // Test different output modes
  test('different output modes', () => {
    // Create an issue
    runQuietly(`node ${binPath} create feature --title "Output Test" --task "Task 1" --task "Task 2"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Test verbose mode
    const verboseOutput = runQuietly(`node ${binPath} list`, {
      cwd: testDir,
      env: { ...process.env, VERBOSE: 'true' }
    });
    
    // Should include more detail
    expect(verboseOutput.stdout).toContain('Output Test');
    expect(verboseOutput.stdout).toContain('#0001');
    
    // Test quiet mode
    const quietOutput = runQuietly(`node ${binPath} list`, {
      cwd: testDir,
      env: { ...process.env, QUIET: 'true' }
    });
    
    // Should be more concise
    expect(quietOutput.stdout).toContain('Output Test');
    
    // Test JSON output
    const jsonOutput = runQuietly(`node ${binPath} list --json`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should be valid JSON
    expect(() => JSON.parse(jsonOutput.stdout)).not.toThrow();
    const parsed = JSON.parse(jsonOutput.stdout);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Output Test');
  });

  // Test error formatting
  test('error formatting', () => {
    // Test with a command that will cause an error
    const errorOutput = runQuietly(`node ${binPath} show 999`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show error in the stderr
    expect(errorOutput.status).not.toBe(0);
    expect(errorOutput.stderr).toContain('not found');
  });

  // Test warning formatting
  test('warning formatting', () => {
    // Create an issue with an uncommon template type
    const warningOutput = runQuietly(`node ${binPath} create feature --title "Warning Test" --task "Task 1" --weird-flag`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show a warning or error for the unknown flag
    expect(warningOutput.status).not.toBe(0);
    expect(warningOutput.stderr).toBeTruthy();
  });

  // Test success message formatting
  test('success message formatting', () => {
    // Create an issue and check success message
    const createOutput = runQuietly(`node ${binPath} create feature --title "Success Test" --task "Task 1"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show success message
    expect(createOutput.status).toBe(0);
    expect(createOutput.stdout).toContain('Created Issue #0001');
    expect(createOutput.stdout).toContain('Success Test');
  });

  // Test spinner and progress indicators (can't easily test visually, but can test code paths)
  test('progress indicators', () => {
    // Create an issue with DEBUG mode to trigger verbose logging
    const debugOutput = runQuietly(`node ${binPath} create feature --title "Progress Test" --task "Task 1" --task "Task 2" --task "Task 3"`, {
      cwd: testDir,
      env: { ...process.env, DEBUG: 'true' }
    });
    
    // Should succeed and possibly show debug info
    expect(debugOutput.status).toBe(0);
    
    // Complete a task with DEBUG mode
    const completeOutput = runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env, DEBUG: 'true' }
    });
    
    // Should succeed and possibly show debug info
    expect(completeOutput.status).toBe(0);
    expect(completeOutput.stdout).toContain('Task completed');
  });

  // Test table formatting for list output
  test('table formatting for list output', () => {
    // Create multiple issues
    runQuietly(`node ${binPath} create feature --title "First Feature" --task "Task A"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} create bugfix --title "Bug Fix" --task "Task B"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} create refactor --title "Refactoring" --task "Task C"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Get list output
    const listOutput = runQuietly(`node ${binPath} list`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show all issues in some sort of formatted table or list
    expect(listOutput.stdout).toContain('First Feature');
    expect(listOutput.stdout).toContain('Bug Fix');
    expect(listOutput.stdout).toContain('Refactoring');
    expect(listOutput.stdout).toContain('#0001');
    expect(listOutput.stdout).toContain('#0002');
    expect(listOutput.stdout).toContain('#0003');
  });

  // Test formatting with ANSI color codes
  test('ANSI color code formatting', () => {
    // Create an issue
    runQuietly(`node ${binPath} create feature --title "Color Test" --task "Task 1"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Get colored output
    const colorOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    // Should succeed and contain ANSI color codes if implemented
    expect(colorOutput.status).toBe(0);
    expect(colorOutput.stdout).toContain('CURRENT TASK:');
    
    // Check if issue content is displayed
    expect(colorOutput.stdout).toContain('Task 1');
    
    // No-color mode
    const noColorOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env, NO_COLOR: '1' }
    });
    
    // Should still contain the content, but possibly without color codes
    expect(noColorOutput.status).toBe(0);
    expect(noColorOutput.stdout).toContain('CURRENT TASK:');
    expect(noColorOutput.stdout).toContain('Task 1');
  });
});