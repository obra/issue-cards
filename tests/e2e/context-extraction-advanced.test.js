// ABOUTME: Advanced E2E tests for context extraction functionality
// ABOUTME: Tests complex context extraction scenarios with different file types and context triggers

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runQuietly } = require('./e2eHelpers');

describe('Context Extraction Advanced E2E', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;
  let sourceDir;

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-context-extraction-'));
    
    // Create a source directory for code files that will be referenced
    sourceDir = path.join(testDir, 'src');
    fs.mkdirSync(sourceDir, { recursive: true });
    
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
    
    // Initialize issue tracking
    const initResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(initResult.status).toBe(0);
  });

  // Helper to create a test issue with code references
  const createTestIssue = (taskWithFileReference) => {
    return runQuietly(
      `node ${binPath} create feature --title "Context Extraction Test" --task "${taskWithFileReference}"`,
      {
        cwd: testDir,
        env: { ...process.env }
      }
    );
  };

  // Test basic task display with file reference
  test('basic task display with file reference', () => {
    // Create a JavaScript file with sample code
    const jsFilePath = path.join(sourceDir, 'test.js');
    const jsContent = `
    // This is a test file for context extraction
    function testFunction() {
      // This function is referenced in a task
      console.log('Hello, world!');
      return 42;
    }
    
    class TestClass {
      constructor() {
        this.value = 'test';
      }
      
      getValue() {
        return this.value;
      }
    }
    
    module.exports = { testFunction, TestClass };
    `;
    fs.writeFileSync(jsFilePath, jsContent);
    
    // Create an issue with a task that references the file
    const createResult = createTestIssue(`Fix bug in testFunction in ${jsFilePath}`);
    expect(createResult.status).toBe(0);
    
    // Check current task with context
    const currentResult = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify basic task display 
    expect(currentResult.stdout).toContain('CURRENT TASK:');
    expect(currentResult.stdout).toContain(`Fix bug in testFunction in ${jsFilePath}`);
    expect(currentResult.stdout).toContain('CONTEXT:');
  });

  // Test task display with JSON file reference
  test('task display with JSON file reference', () => {
    // Create a JSON file
    const jsonFilePath = path.join(sourceDir, 'config.json');
    const jsonContent = `{
      "name": "test-app",
      "version": "1.0.0",
      "config": {
        "port": 3000,
        "host": "localhost",
        "debug": true
      },
      "dependencies": {
        "express": "^4.17.1",
        "lodash": "^4.17.21"
      }
    }`;
    fs.writeFileSync(jsonFilePath, jsonContent);
    
    // Create an issue with a task that references the JSON file
    const createResult = createTestIssue(`Update port in ${jsonFilePath}`);
    expect(createResult.status).toBe(0);
    
    // Check current task with context
    const currentResult = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify basic task display
    expect(currentResult.stdout).toContain('CURRENT TASK:');
    expect(currentResult.stdout).toContain(`Update port in ${jsonFilePath}`);
    expect(currentResult.stdout).toContain('CONTEXT:');
  });

  // Test task with line number reference
  test('task with line number reference', () => {
    // Create a file with many lines
    const longFilePath = path.join(sourceDir, 'long.js');
    let longContent = '// Long file for testing line number references\n';
    for (let i = 1; i <= 100; i++) {
      longContent += `const line${i} = ${i}; // Line ${i}\n`;
    }
    fs.writeFileSync(longFilePath, longContent);
    
    // Create an issue with a task that references a specific line
    const createResult = createTestIssue(`Fix issue on line 42 in ${longFilePath}`);
    expect(createResult.status).toBe(0);
    
    // Check current task with context
    const currentResult = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify basic task display
    expect(currentResult.stdout).toContain('CURRENT TASK:');
    expect(currentResult.stdout).toContain(`Fix issue on line 42 in ${longFilePath}`);
    expect(currentResult.stdout).toContain('CONTEXT:');
  });

  // Test task with function reference
  test('task with function reference', () => {
    // Create a file with functions
    const functionsFilePath = path.join(sourceDir, 'functions.js');
    const functionsContent = `
    function firstFunction() {
      return 'first';
    }
    
    function targetFunction() {
      // This is the function we want to extract
      const a = 1;
      const b = 2;
      return a + b;
    }
    
    function lastFunction() {
      return 'last';
    }
    `;
    fs.writeFileSync(functionsFilePath, functionsContent);
    
    // Create an issue with a task that references the function
    const createResult = createTestIssue(`Fix targetFunction in ${functionsFilePath}`);
    expect(createResult.status).toBe(0);
    
    // Check current task with context
    const currentResult = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify basic task display
    expect(currentResult.stdout).toContain('CURRENT TASK:');
    expect(currentResult.stdout).toContain(`Fix targetFunction in ${functionsFilePath}`);
    expect(currentResult.stdout).toContain('CONTEXT:');
  });

  // Test task with class reference
  test('task with class reference', () => {
    // Create a file with classes
    const classesFilePath = path.join(sourceDir, 'classes.js');
    const classesContent = `
    class BaseClass {
      constructor() {
        this.base = true;
      }
    }
    
    class TargetClass extends BaseClass {
      constructor() {
        super();
        this.name = 'target';
      }
      
      method1() {
        return this.name;
      }
      
      method2() {
        return 'method2';
      }
    }
    
    class OtherClass {
      constructor() {
        this.other = true;
      }
    }
    `;
    fs.writeFileSync(classesFilePath, classesContent);
    
    // Create an issue with a task that references the class
    const createResult = createTestIssue(`Update TargetClass in ${classesFilePath}`);
    expect(createResult.status).toBe(0);
    
    // Check current task with context
    const currentResult = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify basic task display
    expect(currentResult.stdout).toContain('CURRENT TASK:');
    expect(currentResult.stdout).toContain(`Update TargetClass in ${classesFilePath}`);
    expect(currentResult.stdout).toContain('CONTEXT:');
  });
});