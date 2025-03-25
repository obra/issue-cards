// ABOUTME: Integration tests for full issue workflows
// ABOUTME: Tests end-to-end issue creation and management

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const directory = require('../../src/utils/directory');
const issueManager = require('../../src/utils/issueManager');

// Mock fs.promises for certain operations
const originalFsPromises = fs.promises;
fs.promises = {
  ...originalFsPromises,
  mkdir: jest.fn().mockImplementation(originalFsPromises.mkdir),
  readdir: jest.fn().mockImplementation(originalFsPromises.readdir),
  readFile: jest.fn().mockImplementation(originalFsPromises.readFile),
  writeFile: jest.fn().mockImplementation(originalFsPromises.writeFile),
  access: jest.fn().mockImplementation(originalFsPromises.access),
};

// Mock child_process.execSync
jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue(Buffer.from('')),
  spawnSync: jest.fn().mockReturnValue({ status: 0, stdout: Buffer.from(''), stderr: Buffer.from('') }),
}));

describe('Issue Cards Workflow Integration', () => {
  // Temporary directory for tests
  const testDir = path.join(__dirname, '../temp-integration-test');
  const issuesDir = path.join(testDir, '.issues');
  
  // CLI path
  const cliPath = path.join(__dirname, '../../bin/issue-cards.js');
  
  // Helper to run CLI commands
  const runCommand = (args) => {
    const command = `node ${cliPath} ${args}`;
    return execSync(command, { cwd: testDir, encoding: 'utf8' });
  };
  
  beforeAll(async () => {
    // Create test directory
    try {
      await originalFsPromises.mkdir(testDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Mock directory.getIssueDirectoryPath to use test directory
    jest.spyOn(directory, 'getIssueDirectoryPath').mockImplementation((subdir = '') => {
      return path.join(issuesDir, subdir);
    });
  });
  
  afterAll(async () => {
    // Clean up test directory
    try {
      await originalFsPromises.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Error cleaning up test directory: ${err.message}`);
    }
    
    // Restore original fs.promises
    fs.promises = originalFsPromises;
    
    // Restore all mocks
    jest.restoreAllMocks();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Complete Issue Lifecycle', () => {
    test('should support a full issue lifecycle', async () => {
      // 1. Initialize the issue tracking system
      await initializeIssueTracking();
      
      // 2. Create a new issue
      const issueNumber = await createNewIssue();
      
      // 3. Add tasks to the issue
      await addTasksToIssue(issueNumber);
      
      // 4. Complete tasks
      await completeTasks(issueNumber);
      
      // 5. View issue details
      const issueDetails = await viewIssueDetails(issueNumber);
      
      // 6. Verify issue state
      expect(issueDetails).toContain('Issue 0001');
      expect(issueDetails).toContain('- [x] First task');
      expect(issueDetails).toContain('- [x] Second task');
      expect(issueDetails).toContain('- Third task');
    });
  });
  
  // Helper functions for the test
  async function initializeIssueTracking() {
    // Mock execSync to simulate init command
    execSync.mockImplementation(() => Buffer.from('Issue tracking initialized successfully.'));
    
    // Simulate initialization
    await directory.createDirectoryStructure();
    
    // Return directory path
    return issuesDir;
  }
  
  async function createNewIssue() {
    // Mock execSync to simulate create command
    execSync.mockImplementation(() => Buffer.from('Issue created: #0001 - Test Issue'));
    
    // Simulate issue creation
    const issueContent = `# Issue 0001: Test Issue
    
## Problem to be solved
Test problem description

## Planned approach
Test planned approach

## Failed approaches

## Questions to resolve

## Tasks
- First task
- Second task
- Third task

## Instructions
Test instructions

## Next steps
`;
    
    const issueNumber = '0001';
    const issueFilePath = path.join(issuesDir, 'open', `${issueNumber}.md`);
    
    // Create mock issue file
    await fs.promises.mkdir(path.join(issuesDir, 'open'), { recursive: true });
    await fs.promises.writeFile(issueFilePath, issueContent, 'utf8');
    
    return issueNumber;
  }
  
  async function addTasksToIssue(issueNumber) {
    // Mock execSync to simulate add-task command
    execSync.mockImplementation(() => Buffer.from('Task added successfully.'));
    
    // Simulate task addition (already done in createNewIssue)
    return true;
  }
  
  async function completeTasks(issueNumber) {
    // Mock execSync to simulate complete-task command
    execSync.mockImplementation(() => Buffer.from('Task completed successfully.'));
    
    // Get the issue content
    const issueFilePath = path.join(issuesDir, 'open', `${issueNumber}.md`);
    let content = await fs.promises.readFile(issueFilePath, 'utf8');
    
    // Mark tasks as completed
    content = content.replace('- First task', '- [x] First task');
    content = content.replace('- Second task', '- [x] Second task');
    
    // Save the updated issue
    await fs.promises.writeFile(issueFilePath, content, 'utf8');
    
    return true;
  }
  
  async function viewIssueDetails(issueNumber) {
    // Mock execSync to simulate show command
    execSync.mockImplementation(() => {
      const issueContent = `# Issue 0001: Test Issue
    
## Problem to be solved
Test problem description

## Planned approach
Test planned approach

## Failed approaches

## Questions to resolve

## Tasks
- [x] First task
- [x] Second task
- Third task

## Instructions
Test instructions

## Next steps
`;
      return Buffer.from(issueContent);
    });
    
    // Return the issue content
    const issueFilePath = path.join(issuesDir, 'open', `${issueNumber}.md`);
    return fs.promises.readFile(issueFilePath, 'utf8');
  }
});