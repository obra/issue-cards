// ABOUTME: End-to-end tests for context extraction functionality
// ABOUTME: Tests the contextExtractor utility in real scenarios

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Context Extractor E2E', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;
  let issueFile;

  // Helper to run commands
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

  // Helper to create a test issue with rich content
  const createTestIssue = () => {
    runCommand('create feature --title "Context Extraction Test" ' +
      '--problem "This is a test problem for context extraction" ' +
      '--approach "The approach is to test all context extraction functions" ' +
      '--failed-approaches "First failed attempt\\nSecond failed attempt" ' +
      '--questions "Question about the context?\\nAnother question about relevance?" ' +
      '--tasks "Task related to extraction #unit-test\\nTask about parsing\\nTask for relevance testing" ' +
      '--instructions "Follow these instructions for testing" ' +
      '--next-steps "Improve context extraction\\nAdd more tests"');
    
    // Add a note with structured content to test complex parsing
    runCommand('add-note "### Failed attempt\nTried using regex for context extraction\n\n**Reason:** Too complex and error-prone" --section "Failed approaches"');
    
    // Get the issue file path
    issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    return fs.readFileSync(issueFile, 'utf8');
  };

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-context-test-'));
    
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
    runCommand('init');
  });

  // Test context extraction through the current command
  // This implicitly tests the contextExtractor functionality
  test('context extraction via current command', () => {
    // Create test issue with rich content
    createTestIssue();
    
    // Check current task (this uses context extraction)
    const output = runCommand('current');
    
    // Verify current task is displayed
    expect(output).toContain('CURRENT TASK:');
    expect(output).toContain('Task related to extraction');
    
    // Verify context is extracted
    expect(output).toContain('This is a test problem for context extraction');
    expect(output).toContain('The approach is to test all context extraction functions');
    
    // Verify next task is shown
    expect(output).toContain('NEXT TASK:');
    expect(output).toContain('Task about parsing');
  });

  // Test task completion with extracted context
  test('task completion with context extraction', () => {
    // Create test issue
    createTestIssue();
    
    // Complete first task
    let output = runCommand('complete-task');
    
    // Verify completion
    expect(output).toContain('✅ Task completed');
    expect(output).toContain('Task related to extraction');
    
    // Verify next task context
    expect(output).toContain('NEXT TASK:');
    expect(output).toContain('Task about parsing');
    
    // Complete second task
    output = runCommand('complete-task');
    
    // Verify correct next task
    expect(output).toContain('Task for relevance testing');
  });

  // Test tag-based context extraction
  test('context extraction with tagged tasks', () => {
    // Create issue with tagged tasks
    runCommand('create feature --title "Tagged Context Test" ' +
      '--tasks "Task with unit-test tag #unit-test\\nTask with e2e-test tag #e2e-test"');
    
    // First current will show the unit-test task with expanded context
    const output = runCommand('current');
    
    // Verify unit test steps are shown
    expect(output).toContain('Write failing unit tests');
    expect(output).toContain('Task with unit-test tag');
  });

  // Test question relevance in context
  test('question relevance in context', () => {
    // Create issue with related questions and tasks
    runCommand('create feature --title "Question Relevance Test" ' +
      '--tasks "Implement user authentication" ' +
      '--questions "How should we handle user credentials?\\nWhat is the password reset flow?\\nWhen should authorization happen?"');
    
    // Current task should include the relevant questions
    const output = runCommand('current');
    
    // Verify questions about authentication are shown in context
    expect(output).toContain('Implement user authentication');
    expect(output).toContain('How should we handle user credentials?');
    // The third question might also be shown depending on relevance algorithm
  });

  // Test failed approach relevance
  test('failed approach relevance in context', () => {
    // Create issue with failed approaches related to a specific task
    runCommand('create feature --title "Failed Approach Test" ' +
      '--tasks "Implement API caching" ' +
      '--failed-approaches "Tried using localStorage for API cache\\nAttempted to use service workers for caching"');
    
    // Add a structured failed approach
    runCommand('add-note "### Failed attempt\nTried using memory cache\n\n**Reason:** Cache was lost on page reload" --section "Failed approaches"');
    
    // Current task should include the relevant failed approaches
    const output = runCommand('current');
    
    // Verify failed approaches about caching are shown
    expect(output).toContain('Implement API caching');
    expect(output).toContain('Tried using localStorage for API cache');
    expect(output).toContain('Tried using memory cache');
  });

  // Test word relevance filtering
  test('word relevance filtering in context', () => {
    // Create issue with various sections containing different keywords
    runCommand('create feature --title "Word Relevance Test" ' +
      '--problem "Need to improve performance in the database queries" ' +
      '--approach "Will optimize SQL queries and add indexes" ' +
      '--tasks "Analyze slow queries\\nAdd database indexes\\nImplement query caching" ' +
      '--questions "Which queries are slowest?\\nHow to measure performance improvement?"');
    
    // Complete first task
    runCommand('complete-task');
    
    // Current should show the second task about database indexes
    const output = runCommand('current');
    
    // Verify context shows relevant parts about database
    expect(output).toContain('Add database indexes');
    expect(output).toContain('Need to improve performance in the database queries');
    // It should find the relevant connection between database and indexes
  });

  // Test the full rich context extraction
  test('full rich context extraction', () => {
    // Create a comprehensive issue with all sections populated
    runCommand('create feature --title "Comprehensive Context Test" ' +
      '--problem "This is a complex problem with multiple aspects" ' +
      '--approach "The approach has several steps and considerations" ' +
      '--failed-approaches "Approach 1 that failed\\nApproach 2 that also failed" ' +
      '--questions "Important question 1?\\nImportant question 2?" ' +
      '--tasks "First important task\\nSecond related task\\nThird follow-up task" ' +
      '--instructions "Follow these detailed instructions" ' +
      '--next-steps "Future work item 1\\nFuture work item 2"');
    
    // Add a note to problem section
    runCommand('add-note "Additional problem details and context" --section "Problem to be solved"');
    
    // Add a structured failed approach
    runCommand('add-note "### Failed attempt\nDetailed explanation of failure\n\n**Reason:** Specific reason for failure" --section "Failed approaches"');
    
    // Generate a task completion that shows extensive context
    const output = runCommand('complete-task');
    
    // The output should contain elements from multiple relevant sections
    expect(output).toContain('This is a complex problem');
    expect(output).toContain('The approach has several steps');
    expect(output).toContain('NEXT TASK:');
    expect(output).toContain('Second related task');
  });
});