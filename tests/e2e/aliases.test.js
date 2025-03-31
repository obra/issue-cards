// ABOUTME: End-to-end tests for command aliases
// ABOUTME: Verifies that command aliases function correctly at the CLI level

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

// Resolve the path to the bin script
const binPath = path.resolve(__dirname, '../../bin/issue-cards.js');

// Create a temporary directory for testing
const testDir = path.join(os.tmpdir(), `aliases-test-${Date.now()}`);

// Helper function to run commands and capture output
function runCommand(command) {
  try {
    const result = execSync(`node ${binPath} ${command}`, {
      cwd: testDir,
      env: { ...process.env, ISSUE_CARDS_DIR: path.join(testDir, '.issues') },
      encoding: 'utf8'
    });
    return { status: 0, stdout: result.trim(), stderr: '' };
  } catch (error) {
    return {
      status: error.status || 1,
      stdout: error.stdout ? error.stdout.toString() : '',
      stderr: error.stderr ? error.stderr.toString() : ''
    };
  }
}

describe('Command Aliases E2E', () => {
  // Set up the test directory before running tests
  beforeAll(() => {
    // Create the test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Initialize issue tracking in the test directory
    runCommand('init');
    
    // Create a test issue
    runCommand('create feature --title "Test Aliases" --task "Task 1" --task "Task 2"');
  });
  
  // Clean up after all tests
  afterAll(() => {
    // Remove the test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });
  
  // Test if 'complete' alias works correctly
  test('"complete" alias for complete-task command', () => {
    // Run the command with alias
    const result = runCommand('complete');
    
    // Check the output
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Task completed');
  });
  
  // Test if 'add' alias works correctly
  test('"add" alias for add-task command', () => {
    // Run the command with alias
    const result = runCommand('add "New task via alias"');
    
    // Check the output
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Task added');
    
    // Verify task was added
    const showResult = runCommand('show');
    expect(showResult.stdout).toContain('New task via alias');
  });
  
  // Test if 'question' alias works correctly
  test('"question" alias for add-question command', () => {
    // Run the command with alias
    const result = runCommand('question "New question via alias?"');
    
    // Check the output
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Added question');
    
    // Verify question was added
    const showResult = runCommand('show');
    expect(showResult.stdout).toContain('New question via alias?');
  });
  
  // Test if 'failure' alias works correctly
  test('"failure" alias for log-failure command', () => {
    // Run the command with alias
    const result = runCommand('failure "Failed approach via alias" -r "Testing alias"');
    
    // Check the output
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Logged failed approach');
    
    // Verify failure was logged
    const showResult = runCommand('show');
    expect(showResult.stdout).toContain('Failed approach via alias');
  });
});