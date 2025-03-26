// ABOUTME: End-to-end test for template variable replacement
// ABOUTME: Tests that Handlebars double-brace syntax works correctly

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runQuietly } = require('./e2eHelpers');

describe('Template Variable Rendering E2E', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-template-test-'));
    
    // Path to the binary
    binPath = path.resolve(__dirname, '../../bin/issue-cards.js');
    
    // Make sure the binary is executable
    try {
      fs.chmodSync(binPath, '755');
    } catch (error) {
      console.warn(`Could not chmod binary: ${error.message}`);
    }
    
    // Set environment variable for tests
    process.env.ISSUE_CARDS_DIR = path.join(testDir, '.issues');
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
  
  test('template variables are correctly replaced (double braces syntax)', () => {
    // 1. Initialize issue tracking
    const initResult = runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(initResult.status).toBe(0);
    
    // Verify template was created with double braces
    const featureTemplatePath = path.join(testDir, '.issues/config/templates/issue/feature.md');
    const templateContent = fs.readFileSync(featureTemplatePath, 'utf8');
    
    // Check that the template uses double braces
    expect(templateContent).toContain('{{NUMBER}}');
    expect(templateContent).toContain('{{TITLE}}');
    expect(templateContent).toContain('{{PROBLEM}}');
    
    // 2. Create a new issue
    const createResult = runQuietly(`node ${binPath} create feature --title "Template Variables Test" --problem "Testing variable replacement" --approach "Using double braces"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    expect(createResult.status).toBe(0);
    
    // Find the created issue file
    const openDir = path.join(testDir, '.issues/open');
    const issueFiles = fs.readdirSync(openDir);
    expect(issueFiles.length).toBeGreaterThan(0);
    
    const issueFile = path.join(openDir, issueFiles[0]);
    const issueContent = fs.readFileSync(issueFile, 'utf8');
    
    // 3. Verify variables were replaced properly
    expect(issueContent).toContain('# Issue 0001: Template Variables Test');
    expect(issueContent).toContain('Testing variable replacement');
    expect(issueContent).toContain('Using double braces');
    
    // No double-brace variables should remain
    expect(issueContent).not.toContain('{{NUMBER}}');
    expect(issueContent).not.toContain('{{TITLE}}');
    expect(issueContent).not.toContain('{{PROBLEM}}');
    expect(issueContent).not.toContain('{{APPROACH}}');
  });
});