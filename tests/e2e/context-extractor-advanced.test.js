// ABOUTME: Advanced E2E tests for context extraction mechanisms
// ABOUTME: Tests the contextExtractor functionality in real-world scenarios

const fs = require('fs');
const path = require('path');
const os = require('os');
const { runQuietly } = require('./e2eHelpers');

describe('Context Extractor Advanced E2E', () => {
  let testDir;
  let binPath;
  let originalIssuesDir;
  let issueFile;

  beforeAll(() => {
    // Save the original environment
    originalIssuesDir = process.env.ISSUE_CARDS_DIR;
    
    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-cards-context-advanced-'));
    
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
    runQuietly(`node ${binPath} init`, {
      cwd: testDir,
      env: { ...process.env }
    });
  });

  // Helper to create a complex issue
  const createComplexIssue = () => {
    // Create an issue with rich content in all sections
    runQuietly(`node ${binPath} create feature --title "Advanced Context Test" ` +
      `--problem "Our application needs to extract and analyze various types of context from markdown files. This includes sections, tasks, questions, and failed approaches." ` +
      `--approach "We will implement a flexible context extraction system that can identify and process different components of an issue." ` +
      `--task "Implement base context extraction" ` +
      `--task "Add support for failed approaches" ` +
      `--task "Implement question parsing" ` +
      `--task "Create task relevance scoring" ` +
      `--task "Add file context extraction" ` +
      `--questions "How should we handle nested markdown sections?\\nWhat's the best strategy for determining task relevance?\\nShould we support complex markdown formatting?" ` +
      `--instructions "Follow clean code principles and ensure all functions are well documented."`,
      {
        cwd: testDir,
        env: { ...process.env }
      }
    );
    
    // Add complex failed approaches with structured format
    runQuietly(`node ${binPath} add-note "### Failed attempt\\nTried using regular expressions exclusively\\n\\n**Reason:** Too brittle and difficult to maintain for complex markdown\\n\\n### Failed attempt\\nAttempted to use a full markdown parser\\n\\n**Reason:** Overkill for our needs and added unnecessary dependencies" --section "Failed approaches"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Get the issue file
    issueFile = path.join(testDir, '.issues/open/issue-0001.md');
    expect(fs.existsSync(issueFile)).toBe(true);
    
    return issueFile;
  };

  // Test extraction of complex context for current task
  test('extracting context for current task', () => {
    console.log("Starting extracting context for current task test");
    
    // Create a complex issue
    const issueFile = createComplexIssue();
    
    // Check current task to see what context is extracted
    const currentOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Log the actual output for debugging
    console.log("TEST DEBUG - Current output:");
    console.log(currentOutput.stdout);
    
    // Context should include problem description
    expect(currentOutput.stdout).toContain('Our application needs to extract and analyze');
    
    // Context should include planned approach
    expect(currentOutput.stdout).toContain('flexible context extraction system');
    
    // Context should include failed approaches (the actual header name used in the output)
    expect(currentOutput.stdout).toContain('Failed approaches');
    
    // Context should include questions
    expect(currentOutput.stdout).toContain('nested markdown sections');
    
    // Context should include instructions
    expect(currentOutput.stdout).toContain('Follow clean code principles');
    
    // Current task should be shown
    expect(currentOutput.stdout).toContain('Implement base context extraction');
    
    // Next task should be shown
    expect(currentOutput.stdout).toContain('Add support for failed approaches');
  });
  
  // Test task relevance and context scoring
  test('task relevance and context scoring', () => {
    // Create a complex issue
    createComplexIssue();
    
    // Complete first task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Now check second task's context
    const currentOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Current task should be the second one
    expect(currentOutput.stdout).toContain('Add support for failed approaches');
    
    // Context should include relevant failed approaches content
    expect(currentOutput.stdout).toContain('regular expressions');
    expect(currentOutput.stdout).toContain('Too brittle');
    
    // Complete second task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Check third task's context
    const thirdTaskOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Current task should be the third one
    expect(thirdTaskOutput.stdout).toContain('Implement question parsing');
    
    // Context should include relevant question info
    expect(thirdTaskOutput.stdout).toContain('How should we handle nested markdown sections?');
  });
  
  // Test extraction of context with keyword search
  test('context extraction with keyword search', () => {
    // Create issue with keywords
    runQuietly(`node ${binPath} create feature --title "Keyword Context Test" ` +
      `--problem "We need to implement a search feature that finds all relevant content based on keywords." ` +
      `--approach "We will use indexing and relevance scoring to match keywords to content." ` +
      `--task "Create keyword extraction algorithm" ` +
      `--task "Implement search matching logic" ` +
      `--task "Add relevance scoring" ` +
      `--questions "How do we handle partial word matches?\\nShould we use stemming for better matches?" ` +
      `--instructions "Focus on search performance and accuracy."`,
      {
        cwd: testDir,
        env: { ...process.env }
      }
    );
    
    // Add notes with specific keywords
    runQuietly(`node ${binPath} add-note "For keyword extraction, we should consider tokenization and stop words removal." --section "Problem to be solved"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} add-note "Our search matching should support exact and fuzzy matching of keywords." --section "Planned approach"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} add-note "### Failed attempt\\nTried naive string matching for keywords\\n\\n**Reason:** Too slow and not effective for partial matches" --section "Failed approaches"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Check first task for keyword-relevant context
    const currentOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Context should include keyword extraction related content
    expect(currentOutput.stdout).toContain('tokenization');
    expect(currentOutput.stdout).toContain('stop words');
    expect(currentOutput.stdout).toContain('keyword extraction');
    
    // Complete first task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Check second task for search matching related context
    const secondOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Context should include search matching related content
    expect(secondOutput.stdout).toContain('Implement search matching logic');
    expect(secondOutput.stdout).toContain('exact and fuzzy matching');
  });
  
  // Test context extraction with file references
  test('context extraction with file references', () => {
    // Create sample files that will be referenced
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    
    const contextFile = path.join(srcDir, 'contextExtractor.js');
    fs.writeFileSync(contextFile, `
    // Context extraction utility
    function extractContextFromFile(content) {
      // TODO: Implement context extraction
      return { problem: '', approaches: [], questions: [] };
    }
    
    function findRelevantContext(keyword, content) {
      // TODO: Implement keyword-based context search
      return [];
    }
    
    module.exports = { extractContextFromFile, findRelevantContext };
    `);
    
    const searchFile = path.join(srcDir, 'search.js');
    fs.writeFileSync(searchFile, `
    // Search implementation
    function searchByKeyword(keyword, documents) {
      // TODO: Implement search
      return [];
    }
    
    function calculateRelevance(keyword, document) {
      // TODO: Implement relevance calculation
      return 0;
    }
    
    module.exports = { searchByKeyword, calculateRelevance };
    `);
    
    // Create issue with file references
    runQuietly(`node ${binPath} create feature --title "File Context Test" ` +
      `--problem "We need to improve our context extraction with file references." ` +
      `--approach "We will enhance contextExtractor.js to identify and extract relevant portions of referenced files." ` +
      `--task "Implement findRelevantContext in ${contextFile}" ` +
      `--task "Add file reference handling to extractContextFromFile" ` +
      `--task "Connect search.js with context extraction" ` +
      `--instructions "Make sure to handle file paths correctly across different operating systems."`,
      {
        cwd: testDir,
        env: { ...process.env }
      }
    );
    
    // Check current task with file reference
    const currentOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should include current task with file reference
    expect(currentOutput.stdout).toContain(`Implement findRelevantContext in ${contextFile}`);
    
    // Should include file context
    expect(currentOutput.stdout).toContain('findRelevantContext');
    
    // Complete first task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Check next task
    const nextOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should include file context for extractContextFromFile
    expect(nextOutput.stdout).toContain('Add file reference handling');
    expect(nextOutput.stdout).toContain('extractContextFromFile');
  });
  
  // Test significant word extraction for relevance
  test('significant word extraction for relevance', () => {
    // Create issue with similar but distinct tasks
    runQuietly(`node ${binPath} create feature --title "Word Relevance Test" ` +
      `--problem "We need to distinguish between similar tasks based on word significance." ` +
      `--approach "We'll implement an algorithm that ignores common words and focuses on significant terms." ` +
      `--task "Create database migration script" ` +
      `--task "Implement database query caching" ` +
      `--task "Design database schema" ` +
      `--questions "How do we determine which words are significant?\\nShould we use a pre-defined stopword list?" ` +
      `--instructions "Focus on precision in relevance matching."`,
      {
        cwd: testDir,
        env: { ...process.env }
      }
    );
    
    // Add specific content for each task area
    runQuietly(`node ${binPath} add-note "The migration script needs to handle schema versioning and data transformations." --section "Problem to be solved"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} add-note "For query caching, we'll need to implement a cache invalidation strategy." --section "Planned approach"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    runQuietly(`node ${binPath} add-note "The database schema should include tables for users, products, and orders." --section "Instructions"`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Check first task context
    const firstOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show migration-specific context
    expect(firstOutput.stdout).toContain('Create database migration script');
    expect(firstOutput.stdout).toContain('migration script');
    expect(firstOutput.stdout).toContain('schema versioning');
    
    // Complete first task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Check second task context
    const secondOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show caching-specific context
    expect(secondOutput.stdout).toContain('Implement database query caching');
    expect(secondOutput.stdout).toContain('query caching');
    expect(secondOutput.stdout).toContain('cache invalidation');
    
    // Complete second task
    runQuietly(`node ${binPath} complete-task`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Check third task context
    const thirdOutput = runQuietly(`node ${binPath} current`, {
      cwd: testDir,
      env: { ...process.env }
    });
    
    // Should show schema-specific context
    expect(thirdOutput.stdout).toContain('Design database schema');
    expect(thirdOutput.stdout).toContain('database schema');
    expect(thirdOutput.stdout).toContain('tables for users');
  });
});