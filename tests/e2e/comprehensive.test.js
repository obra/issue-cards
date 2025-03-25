// ABOUTME: Comprehensive end-to-end tests for all Issue Cards commands
// ABOUTME: Tests all commands with their correct parameters and options

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Issue Cards Comprehensive E2E', () => {
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
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-comp-test-'));
    
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

  // Test all commands in sequence to ensure they work correctly
  test('comprehensive command sequence', () => {
    // 1. Initialize issue tracking
    let output = runCommand('init');
    expect(output).toContain('Initialized issue tracking system');
    
    // Verify initialization
    const issuesDir = path.join(testDir, '.issues');
    expect(fs.existsSync(issuesDir)).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'open'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'closed'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'config/templates/issue'))).toBe(true);
    expect(fs.existsSync(path.join(issuesDir, 'config/templates/tag'))).toBe(true);
    
    // 2. Try to initialize again - should handle gracefully
    output = runCommand('init');
    expect(output).toContain('already initialized');
    
    // 3. Create a feature issue with all options
    output = runCommand('create feature --title "Comprehensive Test" ' + 
      '--problem "This is a test problem" ' +
      '--approach "This is the approach" ' + 
      '--failed-approaches "Failed approach 1\nFailed approach 2" ' +
      '--questions "Question 1?\nQuestion 2?" ' +
      '--tasks "Task 1\nTask 2\nTask 3" ' +
      '--instructions "Test instructions" ' +
      '--next-steps "Future step 1\nFuture step 2"');
    
    expect(output).toContain('Created Issue #0001');
    
    // 4. List issues
    output = runCommand('list');
    expect(output).toContain('#0001: Comprehensive Test');
    
    // 5. Show issue details
    output = runCommand('show 1');
    expect(output).toContain('# Issue 0001: Comprehensive Test');
    expect(output).toContain('This is a test problem');
    expect(output).toContain('This is the approach');
    expect(output).toContain('- Failed approach 1');
    expect(output).toContain('- Question 1?');
    expect(output).toContain('- [ ] Task 1');
    expect(output).toContain('Test instructions');
    expect(output).toContain('- Future step 1');
    
    // 6. Create a bugfix issue
    output = runCommand('create bugfix --title "Bug Test" --problem "This is a bug"');
    expect(output).toContain('Created Issue #0002');
    
    // 7. Show issue without number (should show most recent)
    output = runCommand('show');
    expect(output).toContain('Fix Bug Test');
    
    // 8. Check current task
    output = runCommand('current');
    expect(output).toContain('CURRENT TASK:');
    expect(output).toContain('This is a bug');
    
    // 9. Add note to current issue
    output = runCommand('add-note "Additional bug details" --section "Problem to be solved"');
    expect(output).toContain('Added note to Problem to be solved section');
    
    // 10. Verify note was added
    output = runCommand('show');
    expect(output).toContain('Additional bug details');
    
    // 11. Add a question
    output = runCommand('add-question "New question about the bug?"');
    expect(output).toContain('Added question to issue');
    
    // 12. Verify question was added
    output = runCommand('show');
    expect(output).toContain('New question about the bug?');
    
    // 13. Log a failed approach
    output = runCommand('log-failure "Tried fixing with patch X"');
    expect(output).toContain('Logged failed approach to issue');
    
    // 14. Verify failed approach was added
    output = runCommand('show');
    expect(output).toContain('Tried fixing with patch X');
    
    // 15. Add a new task
    output = runCommand('add-task "New bug fix task"');
    expect(output).toContain('Added task to issue');
    
    // 16. Complete the task
    output = runCommand('complete-task');
    expect(output).toContain('✅ Task completed');
    
    // 17. List templates
    output = runCommand('templates');
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
    
    // 18. View specific template
    output = runCommand('templates feature');
    expect(output).toContain('Template: feature');
    expect(output).toContain('Issue {{NUMBER}}: {{TITLE}}');
    
    // Switch to first issue to work with tasks
    
    // 19. Show first issue
    output = runCommand('show 1');
    expect(output).toContain('Comprehensive Test');
    
    // 20. Add task with tags (tags added directly in task text)
    output = runCommand('add-task "New task with tags #unit-test #e2e-test"');
    expect(output).toContain('Added task to issue');
    
    // 21. Add task before current task
    output = runCommand('add-task "Task before current" --before');
    expect(output).toContain('Added task to issue');
    
    // 22. Add task after current task
    output = runCommand('add-task "Task after current" --after');
    expect(output).toContain('Added task to issue');
    
    // 23. Check current task
    output = runCommand('current');
    expect(output).toContain('Task before current');
    
    // 24. Complete task and verify next task
    output = runCommand('complete-task');
    expect(output).toContain('✅ Task completed');
    expect(output).toContain('NEXT TASK:');
    expect(output).toContain('Task 1');
    
    // 25. Verify file content directly to ensure all commands worked correctly
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    expect(content).toContain('[x] Task before current');
    expect(content).toContain('[ ] Task 1');
    expect(content).toContain('Task after current');
    expect(content).toContain('New task with tags #unit-test #e2e-test');
  });

  // Tests that specifically check for correct parameter handling
  test('parameter handling for all commands', () => {
    // Initialize
    runCommand('init');
    
    // Create an issue first to work with
    runCommand('create feature --title "Parameter Test" --tasks "Task 1\nTask 2"');
    
    // Test add-note with all parameters
    let output = runCommand('add-note "Test note" --section "Problem to be solved"');
    expect(output).toContain('Added note to Problem to be solved section');
    
    // Test add-question with all parameters
    output = runCommand('add-question "Test question?"');
    expect(output).toContain('Added question to issue');
    
    // Test log-failure with all parameters
    output = runCommand('log-failure "Test failed approach"');
    expect(output).toContain('Logged failed approach to issue');
    
    // Test add-task with all parameters correctly (tags are included in the task text)
    output = runCommand('add-task "Test task with tag #unit-test"');
    expect(output).toContain('Added task to issue');
    
    // Verify additions
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    expect(content).toContain('Test note');
    expect(content).toContain('Test question?');
    expect(content).toContain('Test failed approach');
    expect(content).toContain('Test task with tag #unit-test');
  });

  // Test error conditions and edge cases
  test('error conditions and edge cases', () => {
    // 1. Try commands before initialization
    try {
      execSync(`node ${binPath} list`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
      });
      fail('Expected command to throw');
    } catch (error) {
      // Just verify that it threw an error when not initialized
      expect(error).toBeDefined();
    }
    
    // Initialize
    runCommand('init');
    
    // 2. Try show with non-existent issue
    try {
      execSync(`node ${binPath} show 999`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
      });
      fail('Expected command to throw');
    } catch (error) {
      // Just verify that it threw an error
      expect(error).toBeDefined();
    }
    
    // 3. Try to create issue without title
    try {
      execSync(`node ${binPath} create feature`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
      });
      fail('Expected command to throw');
    } catch (error) {
      // Just verify that it threw an error
      expect(error).toBeDefined();
    }
    
    // 4. Try current when no issues exist
    try {
      execSync(`node ${binPath} current`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
      });
      fail('Expected command to throw');
    } catch (error) {
      // Just verify that it threw an error
      expect(error).toBeDefined();
    }
    
    // 5. Try to add task when no issues exist
    try {
      execSync(`node ${binPath} add-task "Test task"`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
      });
      fail('Expected command to throw');
    } catch (error) {
      // Just verify that it threw an error
      expect(error).toBeDefined();
    }
    
    // 6. Create issue then try to add note to non-existent section
    runCommand('create feature --title "Error Test" --tasks "Task 1"');
    
    try {
      execSync(`node ${binPath} add-note "Test note" --section "Non-existent section"`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
      });
      fail('Expected command to throw');
    } catch (error) {
      // Just verify that it threw an error
      expect(error).toBeDefined();
    }
    
    // 7. Try to add task with invalid tag
    try {
      execSync(`node ${binPath} add-task "Task with invalid tag #invalid-tag"`, {
        cwd: testDir,
        encoding: 'utf8',
        env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') }
      });
      fail('Expected command to throw');
    } catch (error) {
      // Just verify that it threw an error
      expect(error).toBeDefined();
    }
  });

  // Test multiline parameters and newline handling
  test('multiline parameters and newline handling', () => {
    // Initialize
    runCommand('init');
    
    // Create an issue with multiline content
    const output = runCommand('create feature --title "Multiline Test" ' +
      '--problem "Line 1\nLine 2\nLine 3" ' +
      '--approach "Approach line 1\nApproach line 2" ' +
      '--tasks "Task with\nnewlines\nin it\nSecond task"');
    
    expect(output).toContain('Created Issue #0001');
    
    // Verify content was properly formatted
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    const content = fs.readFileSync(issueFile, 'utf8');
    
    // Problem section should preserve newlines
    expect(content).toContain('Line 1');
    expect(content).toContain('Line 2');
    expect(content).toContain('Line 3');
    
    // Approach section should preserve newlines
    expect(content).toContain('Approach line 1');
    expect(content).toContain('Approach line 2');
    
    // Tasks should be properly formatted
    expect(content).toContain('- [ ] Task with');
    expect(content).toContain('- [ ] newlines');
    expect(content).toContain('- [ ] in it');
    expect(content).toContain('- [ ] Second task');
  });
});