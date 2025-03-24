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
      '--tasks "Task 1\nTask 2\nTask 3" ' +
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
    runCommand('create feature --title "Task Options Test" --tasks "Existing task"');
    
    // Add task with all options
    let output = runCommand('add-task "New task with tags" --tags "unit-test,update-docs" --issue 1');
    expect(output).toContain('Added task to issue');
    
    // Add task before current
    output = runCommand('add-task "Task before current" --before --issue 1');
    expect(output).toContain('Added task to issue');
    
    // Add task after current but not at end
    output = runCommand('add-task "Task after current" --after --issue 1');
    expect(output).toContain('Added task to issue');
    
    // Verify task order and tags
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    const taskLines = content.split('\n').filter(line => line.includes('- [ ]'));
    expect(taskLines[0]).toContain('Task before current');
    expect(taskLines[1]).toContain('Existing task');
    expect(taskLines[2]).toContain('Task after current');
    expect(taskLines[3]).toContain('New task with tags');
    expect(taskLines[3]).toContain('#unit-test');
    expect(taskLines[3]).toContain('#update-docs');
  });

  // Test note and question commands
  test('note and question commands', () => {
    // Create an issue first
    runCommand('create feature --title "Notes Test" --problem "Initial problem"');
    
    // Add note with section specified
    let output = runCommand('add-note "Additional problem info" --section "Problem to be solved" --issue 1');
    expect(output).toContain('Added note to Problem to be solved section');
    
    // Add question
    output = runCommand('add-question "Important question?" --issue 1');
    expect(output).toContain('Added question to issue');
    
    // Log a failed approach
    output = runCommand('log-failure "This didn\'t work" --issue 1');
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
    // Create multiple issues
    runCommand('create feature --title "First Issue" --problem "First problem"');
    runCommand('create bugfix --title "Second Issue" --problem "Second problem"');
    runCommand('create refactor --title "Third Issue" --problem "Third problem"');
    
    // Test list command
    let output = runCommand('list');
    expect(output).toContain('#0001: First Issue');
    expect(output).toContain('#0002: Fix Second Issue');
    expect(output).toContain('#0003: Refactor Third Issue');
    
    // Test show command with issue number
    output = runCommand('show 2');
    expect(output).toContain('# Issue 0002: Fix Second Issue');
    expect(output).toContain('Second problem');
    expect(output).not.toContain('First problem');
    
    // Test show without issue number (should show most recent)
    output = runCommand('show');
    expect(output).toContain('# Issue 0003: Refactor Third Issue');
    expect(output).toContain('Third problem');
  });

  // Test current and complete-task commands
  test('current and complete-task commands', () => {
    // Create an issue with multiple tasks
    runCommand('create feature --title "Task Management" --tasks "Task 1\nTask 2\nTask 3"');
    
    // Check current task
    let output = runCommand('current');
    expect(output).toContain('CURRENT TASK:');
    expect(output).toContain('Task 1');
    
    // Complete the task
    output = runCommand('complete-task');
    expect(output).toContain('✅ Task completed');
    expect(output).toContain('NEXT TASK:');
    expect(output).toContain('Task 2');
    
    // Check current task again
    output = runCommand('current');
    expect(output).toContain('CURRENT TASK:');
    expect(output).toContain('Task 2');
    
    // Complete all tasks
    runCommand('complete-task');
    output = runCommand('complete-task');
    expect(output).toContain('✅ Task completed');
    expect(output).toContain('All tasks completed');
    
    // Verify all tasks are marked as completed
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    expect(content).toContain('[x] Task 1');
    expect(content).toContain('[x] Task 2');
    expect(content).toContain('[x] Task 3');
  });

  // Test templates command
  test('templates command', () => {
    // List all templates
    let output = runCommand('templates');
    expect(output).toContain('Available Issue Templates:');
    expect(output).toContain('feature');
    expect(output).toContain('bugfix');
    expect(output).toContain('refactor');
    expect(output).toContain('audit');
    
    expect(output).toContain('Available Tag Templates:');
    expect(output).toContain('unit-test');
    expect(output).toContain('e2e-test');
    expect(output).toContain('lint-and-commit');
    expect(output).toContain('update-docs');
    
    // View specific template
    output = runCommand('templates unit-test');
    expect(output).toContain('Template: unit-test');
    expect(output).toContain('# unit-test');
    expect(output).toContain('## Steps');
    expect(output).toContain('{{TASK}}');
    
    // View issue template
    output = runCommand('templates feature');
    expect(output).toContain('Template: feature');
    expect(output).toContain('Issue {{NUMBER}}: {{TITLE}}');
    expect(output).toContain('{{PROBLEM}}');
  });

  // Test the version flag
  test('version flag', () => {
    const output = execSync(`node ${binPath} --version`, {
      cwd: testDir,
      encoding: 'utf8'
    });
    
    // Should match semver pattern
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  // Test the help flag
  test('help flag', () => {
    const output = execSync(`node ${binPath} --help`, {
      cwd: testDir,
      encoding: 'utf8'
    });
    
    expect(output).toContain('Usage:');
    expect(output).toContain('Options:');
    expect(output).toContain('Commands:');
    expect(output).toContain('create');
    expect(output).toContain('list');
    expect(output).toContain('show');
    expect(output).toContain('current');
    expect(output).toContain('complete-task');
  });
});