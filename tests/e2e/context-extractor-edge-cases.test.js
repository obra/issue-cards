// ABOUTME: E2E tests for edge cases in context extraction
// ABOUTME: Tests complex content parsing and relevance detection in contextExtractor module

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runQuietly } = require('./e2eHelpers');

describe('Context Extractor Edge Cases E2E', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;
  let issueFile;

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-context-edge-cases-'));
    
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

  // Create a test issue with specified content
  const createComplexIssue = (title, tasks, extraOptions = '') => {
    // Build the command with multiple tasks
    let command = `node ${binPath} create feature --title "${title}" `;
    
    // Add each task
    for (const task of tasks) {
      command += `--task "${task}" `;
    }
    
    // Add any extra options
    command += extraOptions;
    
    // Run the command
    const result = runQuietly(command, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    expect(result.status).toBe(0);
    
    // Get the issue file
    issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    expect(fs.existsSync(issueFile)).toBe(true);
    
    return fs.readFileSync(issueFile, 'utf8');
  };

  // Test getRelevantSections with keyword matching
  test('getRelevantSections with keyword matching', () => {
    // Create an issue with diverse content containing specific keywords
    const tasks = [
      'Implement authentication system',
      'Add user login page',
      'Create database schema for users'
    ];
    
    createComplexIssue('User Authentication', tasks, 
      '--problem "We need a secure authentication system for our application" ' +
      '--approach "We will use JWT tokens for authentication" ' +
      '--questions "How do we handle password reset?\\nHow to implement two-factor authentication?" ' +
      '--failed-approaches "Session-based authentication\\nOAuth integration that was too complex"');
    
    // Add sections with keyword matches in different sections
    runQuietly(`node ${binPath} add-note "### Failed attempt\nTried using basic authentication\n\n**Reason:** Not secure enough" --section "Failed approaches"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Test with a keyword that appears in multiple sections
    const currentAuthOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify relevant content is shown in context
    expect(currentAuthOutput.stdout).toContain('authentication');
    expect(currentAuthOutput.stdout).toContain('secure');
    
    // Complete the first task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify the second task is shown with relevant context
    const secondTaskOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    expect(secondTaskOutput.stdout).toContain('Add user login page');
    expect(secondTaskOutput.stdout).toContain('authentication');
  });

  // Test task relevance scoring with complex content
  test('task relevance scoring with complex content', () => {
    // Create an issue with tasks having different keywords
    const tasks = [
      'Implement database migration system',
      'Set up CI/CD pipeline',
      'Refactor authentication module'
    ];
    
    createComplexIssue('Project Setup', tasks,
      '--problem "We need to set up the initial project infrastructure" ' +
      '--approach "We will set up core systems one by one" ' +
      '--questions "Which database should we use?\\nWhat CI/CD system works best for our needs?" ' +
      '--failed-approaches "Using a monolithic approach\\nTrying serverless architecture"');
    
    // Add different keywords to test relevance
    runQuietly(`node ${binPath} add-note "We considered PostgreSQL and MongoDB for our database needs" --section "Problem to be solved"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} add-note "The CI/CD pipeline should include GitHub Actions" --section "Planned approach"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify first task has relevant content about database
    const currentOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    expect(currentOutput.stdout).toContain('Implement database migration');
    expect(currentOutput.stdout).toContain('database');
    
    // Complete the first task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify second task has CI/CD relevant content
    const secondTaskOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    expect(secondTaskOutput.stdout).toContain('Set up CI/CD pipeline');
    expect(secondTaskOutput.stdout).toContain('CI/CD');
  });

  // Test getContextForTask with specific task text
  test('getContextForTask with specific task text', () => {
    // Create issue with multiple tasks
    const tasks = [
      'Implement user authentication',
      'Create user profile page',
      'Add user settings page'
    ];
    
    createComplexIssue('User Management', tasks,
      '--problem "We need a complete user management system" ' +
      '--approach "Build auth, profile, and settings features" ' +
      '--instructions "Follow the wireframes for UI design"');
    
    // First check that all three tasks exist in the issue
    const showOutput = runQuietly(`node ${binPath} show 1`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify all tasks are in the issue
    expect(showOutput.stdout).toContain('Implement user authentication');
    expect(showOutput.stdout).toContain('Create user profile page');
    expect(showOutput.stdout).toContain('Add user settings page');
    
    // Complete the first task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify second task shows up as current task with proper context
    const currentOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show current task and next task in the output
    expect(currentOutput.stdout).toContain('Create user profile page');
    expect(currentOutput.stdout).toContain('Add user settings page');
    
    // The current command doesn't actually display completed tasks,
    // so we can't check for "Implement user authentication" in the output
  });

  // Test significant word extraction and relevance
  test('significant word extraction and relevance', () => {
    // Create issue with tasks that have significant words
    const tasks = [
      'Implement caching layer for API requests', 
      'Create Docker containerization for services',
      'Set up Kubernetes orchestration'
    ];
    
    createComplexIssue('Infrastructure Setup', tasks,
      '--problem "Our application needs proper infrastructure and performance optimizations" ' +
      '--approach "We will implement caching, containerization, and orchestration" ' +
      '--questions "What caching strategy should we use?\\nHow to structure our Docker images?" ' +
      '--instructions "Use industry best practices for each component"');
    
    // Add notes with keywords that match tasks
    runQuietly(`node ${binPath} add-note "Redis and in-memory caching are both options for our caching layer" --section "Problem to be solved"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} add-note "Docker containerization should follow the multi-stage build pattern" --section "Instructions"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} add-note "Kubernetes clusters will need proper configuration" --section "Next steps"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify first task shows caching-related content
    const currentOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    expect(currentOutput.stdout).toContain('Implement caching layer');
    expect(currentOutput.stdout).toContain('caching');
    expect(currentOutput.stdout).toContain('Redis');
    
    // Complete first task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Verify second task shows Docker-related content
    const secondTaskOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    expect(secondTaskOutput.stdout).toContain('Create Docker containerization');
    expect(secondTaskOutput.stdout).toContain('Docker');
    expect(secondTaskOutput.stdout).toContain('multi-stage build');
  });

  // Test with tasks that have file references
  test('context with file references in tasks', () => {
    // Create a source directory and files
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    
    // Create files with content
    const apiFile = path.join(srcDir, 'api.js');
    fs.writeFileSync(apiFile, `
    // API Module
    function fetchData() {
      // TODO: Implement caching
      return fetch('/api/data');
    }
    
    module.exports = { fetchData };
    `);
    
    const configFile = path.join(srcDir, 'config.js');
    fs.writeFileSync(configFile, `
    // Configuration Module
    const config = {
      apiUrl: 'https://api.example.com',
      timeout: 5000,
      // TODO: Add cache configuration
      enableLogging: true
    };
    
    module.exports = config;
    `);
    
    // Create issue with file references
    const tasks = [
      `Add caching to fetchData in ${apiFile}`,
      `Configure cache settings in ${configFile}`,
      'Write tests for caching layer'
    ];
    
    createComplexIssue('API Caching Implementation', tasks,
      `--problem "API calls need to be cached to improve performance" ` +
      `--approach "Add caching to API module and configure settings" ` +
      `--instructions "Use an LRU cache with configurable TTL"`);
    
    // Verify file content is referenced in context
    const currentOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show task with file reference
    expect(currentOutput.stdout).toContain(`Add caching to fetchData in ${apiFile}`);
    
    // Should show file content or reference
    expect(currentOutput.stdout).toContain('fetchData');
  });
});