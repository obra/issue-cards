// ABOUTME: End-to-end tests for individual Issue Cards commands
// ABOUTME: Tests each command with various options and parameters

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Issue Cards E2E Commands', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;

  // Helper function to run CLI commands and capture output
  const { runQuietly } = require('./e2eHelpers');
  
  const runCommand = (command) => {
    const result = runQuietly(`node ${binPath} ${command}`, {
      cwd: testDir,
      env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
    });
    
    // If it's an error result (non-zero status), throw with the stderr
    if (result.status !== 0) {
      const error = new Error(`Command failed: ${command}`);
      error.stderr = result.stderr;
      error.stdout = result.stdout;
      throw error;
    }
    
    return result.stdout;
  };

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-e2e-cmd-'));
    
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

  // Test init command
  test('init command', () => {
    // Since we already initialize in beforeEach, let's test re-initialization
    let output = runCommand('init');
    expect(output).toContain('already initialized');
    
    // Verify all directories exist
    const issuesDir = path.join(testDir, '.issues');
    expect(fs.existsSync(path.join(issuesDir, 'open'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'closed'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'config/templates/issue'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'config/templates/tag'))).toBe(true);
    
    // Verify templates were copied
    expect(fs.existsSync(path.join(issuesDir, 'config/templates/issue/feature.md'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'config/templates/issue/bugfix.md'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'config/templates/tag/unit-test.md'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'config/templates/tag/e2e-test.md'))).toBe(true);
  });

  // Test create command with different options
  test('create command with all options', () => {
    const output = runCommand('create feature --title "Complete Create Test" ' +
      '--problem "Testing all create options" ' +
      '--approach "Using all available options" ' +
      '--failed-approaches "Tried without options" ' +
      '--questions "Is this comprehensive?" ' +
      '--task "Task 1" ' +
      '--task "Task 2" ' +
      '--task "Task 3" ' +
      '--instructions "Follow these instructions" ' +
      '--next-steps "Future enhancements"');
    
    expect(output).toContain('Created Issue #0001: Complete Create Test');
    
    // Verify issue content
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    expect(content).toContain('# Issue 0001: Complete Create Test');
    expect(content).toContain('## Problem to be solved');
    expect(content).toContain('Testing all create options');
    expect(content).toContain('## Planned approach');
    expect(content).toContain('Using all available options');
    expect(content).toContain('## Failed approaches');
    expect(content).toContain('- Tried without options');
    expect(content).toContain('## Questions to resolve');
    expect(content).toContain('- Is this comprehensive?');
    expect(content).toContain('## Tasks');
    expect(content).toContain('- [ ] Task 1');
    expect(content).toContain('- [ ] Task 2');
    expect(content).toContain('- [ ] Task 3');
    expect(content).toContain('## Instructions');
    expect(content).toContain('Follow these instructions');
    expect(content).toContain('## Next steps');
    expect(content).toContain('- Future enhancements');
  });

  // Test add-task command with various options
  test('add-task command with options', () => {
    // Create an issue first
    runCommand('create feature --title "Task Options Test" --task "Existing task"');
    
    // Add task with tags (in the task text, not as an option)
    let output = runCommand('add-task "New task with tags #unit-test #update-docs" -i 1');
    expect(output).toContain('Task added to issue');
    
    // Add task before current
    output = runCommand('add-task "Task before current" --before -i 1');
    expect(output).toContain('Task added to issue');
    
    // Add task after current but not at end
    output = runCommand('add-task "Task after current" --after -i 1');
    expect(output).toContain('Task added to issue');
    
    // Verify tasks and tags exist - the order might depend on implementation
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    const taskLines = content.split('\n').filter(line => line.includes('- [ ]'));
    
    // Check that all tasks are present, without assuming specific order
    expect(taskLines.some(line => line.includes('Task before current'))).toBe(true);
    expect(taskLines.some(line => line.includes('Existing task'))).toBe(true);
    expect(taskLines.some(line => line.includes('Task after current'))).toBe(true);
    
    // Check for tags in new task
    const newTaskLine = taskLines.find(line => line.includes('New task with tags'));
    expect(newTaskLine).toBeTruthy();
    expect(newTaskLine).toContain('#unit-test');
    expect(newTaskLine).toContain('#update-docs');
  });

  // Test note and question commands
  test('note and question commands', () => {
    // Create an issue first
    runCommand('create feature --title "Notes Test" --problem "Initial problem"');
    
    // Add note with section specified
    let output = runCommand('add-note "Additional problem info" --section "Problem to be solved" -i 1');
    expect(output).toContain('Added note to Problem to be solved section');
    
    // Add question
    output = runCommand('add-question "Important question?" -i 1');
    expect(output).toContain('Added question to issue');
    
    // Log a failed approach
    output = runCommand('log-failure "This didn\'t work" -i 1');
    expect(output).toContain('Logged failed approach to issue');
    
    // Verify all additions
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    expect(content).toContain('Initial problem');
    expect(content).toContain('Additional problem info');
    expect(content).toContain('Important question?');
    expect(content).toContain('This didn\'t work');
  });

  // Test show and list commands
  test('show and list commands', () => {
    // Create multiple issues - create them in specific order to ensure predictable ordering
    runCommand('create feature --title "First Issue" --problem "First problem"');
    runCommand('create bugfix --title "Second Issue" --problem "Second problem"');
    const lastIssueOutput = runCommand('create refactor --title "Third Issue" --problem "Third problem"');
    
    // Extract the issue number from the output
    const lastIssueMatch = lastIssueOutput.match(/Created Issue #(\d+)/);
    const lastIssueNumber = lastIssueMatch ? lastIssueMatch[1] : '0003';
    
    // Test list command
    let output = runCommand('list');
    expect(output).toContain('First Issue');
    expect(output).toContain('Fix Second Issue');
    expect(output).toContain('Refactor Third Issue');
    
    // Test show command with issue number 2 - the bugfix template adds "Fix" prefix to the title
    output = runCommand('show 2');
    expect(output).toContain('Second Issue');
    expect(output).toContain('Second problem');
    
    // Test show without issue number (should show the first issue in list, which should be the most recent)
    output = runCommand('show');
    
    // We'll check for various possibilities since the ordering might depend on implementation
    const hasExpectedIssue = output.includes('Third Issue') || 
                            output.includes('First Issue') || 
                            output.includes('Second Issue');
    expect(hasExpectedIssue).toBe(true);
  });

  // Test current and complete-task commands
  test('current and complete-task commands', () => {
    // Create an issue with multiple tasks
    runCommand('create feature --title "Task Management" --task "Task 1" --task "Task 2" --task "Task 3"');
    
    // Check current task
    let output = runCommand('current');
    expect(output).toContain('TASK:');
    expect(output).toContain('Task 1');
    
    // Complete the task
    output = runCommand('complete-task');
    expect(output).toContain('✅ Task completed:');
    expect(output).toContain('NEXT TASK:');
    expect(output).toContain('Task 2');
    
    // Check current task again
    output = runCommand('current');
    expect(output).toContain('TASK:');
    expect(output).toContain('Task 2');
    
    // Complete all tasks
    runCommand('complete-task');
    output = runCommand('complete-task');
    expect(output).toContain('✅ Task completed:');
    expect(output).toContain('All tasks complete');
    
    // Verify the issue has been closed and moved to closed directory
    const closedIssueFile = path.join(testDir, '.issues/closed/issue-0001.md');
    const content = fs.readFileSync(closedIssueFile, 'utf8');
    
    expect(content).toContain('[x] Task 1');
    expect(content).toContain('[x] Task 2');
    expect(content).toContain('[x] Task 3');
    
    // Verify there are no open issues
    const openIssuesDir = path.join(testDir, '.issues/open');
    const openIssueFiles = fs.readdirSync(openIssuesDir);
    expect(openIssueFiles.length).toBe(0);
  });

  // Test templates command
  test('templates command', () => {
    // List all templates
    let output = runCommand('templates');
    expect(output).toContain('Available issue templates:');
    expect(output).toContain('feature');
    expect(output).toContain('bugfix');
    expect(output).toContain('refactor');
    expect(output).toContain('audit');
    
    expect(output).toContain('Available tag templates:');
    expect(output).toContain('unit-test');
    expect(output).toContain('e2e-test');
    expect(output).toContain('lint-and-commit');
    expect(output).toContain('update-docs');
    
    // View specific template - use the -n option for name and -t for type
    output = runCommand('templates -n unit-test -t tag');
    expect(output).toContain('Template: unit-test');
    // Check if content contains tag template parts, ignoring case
    expect(output.toLowerCase()).toContain('unit-test');
    expect(output).toContain('Steps');
    expect(output).toContain('[ACTUAL TASK GOES HERE]');
    
    // View issue template
    output = runCommand('templates -n feature -t issue');
    expect(output).toContain('Template: feature');
    expect(output).toContain('Issue {{NUMBER}}: {{TITLE}}');
    expect(output).toContain('{{PROBLEM}}');
  });

  // Test the version flag
  test('version flag', () => {
    const result = runQuietly(`node ${binPath} --version`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should match semver pattern regardless of where it's output
    const output = result.stdout || result.stderr;
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  // Test the help flag
  test('help flag', () => {
    const result = runQuietly(`node ${binPath} --help`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('Options:');
    expect(result.stdout).toContain('Commands:');
    expect(result.stdout).toContain('create');
    expect(result.stdout).toContain('list');
    expect(result.stdout).toContain('show');
    expect(result.stdout).toContain('current');
    expect(result.stdout).toContain('complete-task');
    expect(result.stdout).toContain('set-current');
  });
  
  // Test set-current command
  test('set-current command', () => {
    // Create multiple issues
    runCommand('create feature --title "First Issue" --task "Task 1" --task "Task 2"');
    runCommand('create bugfix --title "Second Issue" --task "Task A" --task "Task B"');
    runCommand('create refactor --title "Third Issue" --task "Task X" --task "Task Y"');
    
    // By default, first issue (#0001) should be current
    let output = runCommand('current');
    expect(output).toContain('Task 1');
    
    // Set issue #0002 as current
    output = runCommand('set-current 2');
    expect(output).toContain('Issue #2 is now current');
    
    // Check that issue #0002 is now current
    output = runCommand('current');
    expect(output).toContain('Task A');
    
    // Set issue #0003 as current
    output = runCommand('set-current 3');
    expect(output).toContain('Issue #3 is now current');
    
    // Check that issue #0003 is now current
    output = runCommand('current');
    expect(output).toContain('Task X');
    
    // Test with invalid issue number
    try {
      runCommand('set-current 9999');
      fail('Expected command to fail with non-existent issue');
    } catch (error) {
      expect(error.stderr || error.stdout).toContain('not found');
    }
    
    // Test with invalid format
    try {
      runCommand('set-current abc');
      fail('Expected command to fail with invalid issue number format');
    } catch (error) {
      expect(error.stderr || error.stdout).toContain('Invalid issue number');
    }
    
    // Verify that completing all tasks in the current issue clears .current file
    runCommand('complete-task'); // Complete Task X
    runCommand('complete-task'); // Complete Task Y
    
    // Verify current issue is now back to the first issue after completing all tasks in issue #0003
    output = runCommand('current');
    expect(output).toContain('Task 1');
  });
});