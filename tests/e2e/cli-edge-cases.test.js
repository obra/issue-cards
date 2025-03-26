// ABOUTME: E2E tests for CLI edge cases and rarely-tested paths
// ABOUTME: Tests CLI behavior with unusual inputs, options, and environment variables

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runQuietly } = require('./e2eHelpers');

describe('CLI Edge Cases E2E', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-cli-edge-'));
    
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

  // Test command with unknown options
  test('command with unknown options', () => {
    // Initialize first
    const initResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(initResult.status).toBe(0);
    
    // Test with unknown option
    const result = runQuietly(`node ${binPath} list --unknown-option`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should fail with non-zero exit code
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('unknown option');
  });

  // Test with environment variables for verbosity
  test('verbosity via environment variables', () => {
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
    
    // Test with VERBOSE environment variable
    const verboseResult = runQuietly(`node ${binPath} list`, {
      cwd: testDir,
      env: { ...process.env, VERBOSE: 'true' }
    });
    expect(verboseResult.status).toBe(0);
    
    // Test with QUIET environment variable
    const quietResult = runQuietly(`node ${binPath} list`, {
      cwd: testDir,
      env: { ...process.env, QUIET: 'true' }
    });
    expect(quietResult.status).toBe(0);
  });

  // Test environment variable handling
  test('environment variable handling', () => {
    // Test with DEBUG environment variable
    const debugResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env, DEBUG: 'true' }
    });
    expect(debugResult.status).toBe(0);
    
    // Test with custom directory
    const customDir = path.join(testDir, 'custom-dir');
    const customDirResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env, ISSUE_CARDS_DIR: customDir }
    });
    expect(customDirResult.status).toBe(0);
    expect(fs.existsSync(customDir)).toBe(true);
  });

  // Test invalid JSON handling 
  test('invalid JSON handling', () => {
    // First initialize and create an issue
    runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} create feature --title "Test Issue"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Create an invalid JSON format in the output
    const issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    let content = fs.readFileSync(issueFile, 'utf8');
    
    // Add invalid JSON at the end of the file
    content += '\n\n```json\n{"invalid": "json"\n```';
    fs.writeFileSync(issueFile, content);
    
    // Now try to read the issue
    const result = runQuietly(`node ${binPath} show 1`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should still work even with invalid JSON
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Test Issue');
  });

  // Test with help flag
  test('help flag', () => {
    // Test with help flag
    const result = runQuietly(`node ${binPath} --help`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show help
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('Commands:');
    expect(result.stdout).toContain('Options:');
  });

  // Test with version flag
  test('version flag variants', () => {
    // Test with -V (short flag)
    const shortResult = runQuietly(`node ${binPath} -V`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(shortResult.status).toBe(0);
    expect(shortResult.stdout).toMatch(/\d+\.\d+\.\d+/);
    
    // Test with --version (long flag)
    const longResult = runQuietly(`node ${binPath} --version`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(longResult.status).toBe(0);
    expect(longResult.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  // Test help flag with command
  test('help flag with command', () => {
    // Test help flag with specific command
    const result = runQuietly(`node ${binPath} create --help`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show command-specific help
    expect(result.stdout).toContain('Usage: issue-cards create');
    expect(result.stdout).toContain('--title');
    
    // Help for different commands should be different
    const listHelpResult = runQuietly(`node ${binPath} list --help`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(listHelpResult.stdout).toContain('Usage: issue-cards list');
    expect(listHelpResult.stdout).not.toContain('--title');
  });

  // Test standard output format
  test('standard output format', () => {
    // Initialize and create an issue
    runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} create feature --title "Format Test" --task "Task 1"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Test standard output format
    const listResult = runQuietly(`node ${binPath} list`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should succeed and contain issue title
    expect(listResult.status).toBe(0);
    expect(listResult.stdout).toContain('Format Test');
    expect(listResult.stdout).toContain('#0001');
  });
});