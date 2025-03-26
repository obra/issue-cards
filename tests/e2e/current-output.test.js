// ABOUTME: End-to-end tests for 'current' command output
// ABOUTME: Verifies the improved output format of the current command

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Current Command Output Format', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;

  // Helper function to run CLI commands and capture output
  const runCommand = (command) => {
    try {
      return execSync(`node ${binPath} ${command}`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
      });
    } catch (error) {
      console.error(`Command failed: ${command}`);
      console.error(`Error: ${error.message}`);
      console.error(`Stdout: ${error.stdout}`);
      console.error(`Stderr: ${error.stderr}`);
      throw error;
    }
  };

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-current-test-'));
    
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
    
    // Initialize for each test
    runCommand('init');
  });

  test('current command output format', () => {
    // Create an issue with tasks and context
    runCommand('create feature --title "Output Format Test" ' +
      '--problem "This is a test problem" ' +
      '--approach "This is the approach" ' +
      '--failed-approaches "Failed approach 1" ' +
      '--questions "Question 1?" ' +
      '--task "Task 1" ' +
      '--task "Task 2" ' +
      '--task "Task 3" ' +
      '--instructions "Test instructions"');
    
    // Run the current command and capture output
    const output = runCommand('current');
    
    // Verify improved format
    
    // COMMAND line should not be present
    expect(output).not.toContain('COMMAND: issue-cards current');
    
    // Should have task header in the CURRENT TASK section
    expect(output).toContain('CURRENT TASK:')
    expect(output).toContain('Task 1');
    
    // Should have current task section
    expect(output).toContain('CURRENT TASK:');
    expect(output).toContain('Task 1');
    
    // Should have context with an extra newline after the header
    expect(output).toMatch(/CONTEXT:\s+\n/);
    
    // Should include context sections
    expect(output).toContain('Problem to be solved:');
    expect(output).toContain('This is a test problem');
    expect(output).toContain('Planned approach:');
    expect(output).toContain('This is the approach');
    expect(output).toContain('Failed approaches:');
    expect(output).toContain('Failed approach 1');
    expect(output).toContain('Questions to resolve:');
    expect(output).toContain('Question 1?');
    expect(output).toContain('Instructions:');
    expect(output).toContain('Test instructions');
    
    // Should have the TASKS section with task steps
    expect(output).toMatch(/TASKS:\s+1\. Task 1/);
    
    // Should have next task
    expect(output).toContain('NEXT TASK:');
    expect(output).toContain('Task 2');
    
    // Should have upcoming tasks
    expect(output).toContain('UPCOMING TASKS:');
    expect(output).toContain('Task 3');
    
    // Should have the note about upcoming tasks
    expect(output).toContain('Note: The above upcoming tasks are for context only');
  });
});