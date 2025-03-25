// ABOUTME: End-to-end tests for create command with multiple --task options
// ABOUTME: Verifies the new --task option that can be specified multiple times

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Create Command with Multiple --task Options', () => {
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
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-task-test-'));
    
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

  test('create command with multiple --task options', () => {
    // Create an issue with multiple --task options
    const output = runCommand('create feature --title "Multiple Task Test" ' + 
      '--task "First task" ' +
      '--task "Second task" ' +
      '--task "Third task with #unit-test tag" ' +
      '--task "Fourth task with #e2e-test tag"');
    
    expect(output).toContain('Created Issue #0001');
    
    // Verify the issue content
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    expect(content).toContain('# Issue 0001: Multiple Task Test');
    
    // Verify each task is correctly formatted and on its own line
    expect(content).toContain('- [ ] First task');
    expect(content).toContain('- [ ] Second task');
    expect(content).toContain('- [ ] Third task with #unit-test tag');
    expect(content).toContain('- [ ] Fourth task with #e2e-test tag');
    
    // Make sure we have all 4 tasks (should be 4 checkbox markers)
    const checkboxCount = (content.match(/- \[ \]/g) || []).length;
    expect(checkboxCount).toBe(4);
  });

  test('create command with multiple tasks with various formats', () => {
    // Create an issue with tasks in various formats
    const output = runCommand('create feature --title "Task Formatting Test" ' + 
      '--task "Simple task" ' +
      '--task "Task with #unit-test tag" ' +
      '--task "- [ ] Pre-formatted task"');
    
    expect(output).toContain('Created Issue #0001');
    
    // Verify the issue content
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    expect(content).toContain('# Issue 0001: Task Formatting Test');
    
    // Verify tasks are correctly formatted
    expect(content).toContain('- [ ] Simple task');
    expect(content).toContain('- [ ] Task with #unit-test tag');
    expect(content).toContain('- [ ] Pre-formatted task');
    
    // Make sure we have all 3 tasks (should be 3 checkbox markers)
    const checkboxCount = (content.match(/- \[ \]/g) || []).length;
    expect(checkboxCount).toBe(3);
  });

  test('create command with no tasks', () => {
    // Create an issue with no tasks
    const output = runCommand('create feature --title "No Tasks Test"');
    
    expect(output).toContain('Created Issue #0001');
    
    // Verify the issue content
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    expect(content).toContain('# Issue 0001: No Tasks Test');
    
    // Verify Tasks section exists but is empty
    expect(content).toContain('## Tasks');
    
    // There should be no task checkboxes
    const checkboxCount = (content.match(/- \[ \]/g) || []).length;
    expect(checkboxCount).toBe(0);
  });
});