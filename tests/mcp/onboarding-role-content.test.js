// ABOUTME: Tests for role-specific content in onboarding documentation
// ABOUTME: Verifies that documentation includes required role-specific guidance

const fs = require('fs').promises;
const path = require('path');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '../..');
const docsDir = path.join(projectRoot, 'docs/ai/roles');

// Import the real documentation parser for testing
const { loadRoleDoc } = require('../../src/utils/documentationParser');

// Utility function to read markdown file content directly
async function readMarkdownFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read markdown file ${filePath}: ${error.message}`);
  }
}

describe('Role-specific Onboarding Documentation Content', () => {
  // Testing project manager documentation
  describe('Project Manager Role', () => {
    let pmDoc;
    let rawContent;
    
    beforeAll(async () => {
      // Load the PM documentation via the parser
      pmDoc = loadRoleDoc('pm');
      
      // Also read the raw file for more detailed testing
      rawContent = await readMarkdownFile(path.join(docsDir, 'project-manager.md'));
    });
    
    it('should include ticket creation best practices section', () => {
      expect(rawContent).toContain('## Ticket Creation Best Practices');
      expect(rawContent).toContain('When creating tickets (issues) in issue-cards, follow these guidelines');
    });
    
    it('should include guidance on choosing templates', () => {
      expect(rawContent).toContain('**Choose the right template**');
      expect(rawContent).toContain('feature');
      expect(rawContent).toContain('bugfix');
      expect(rawContent).toContain('refactor');
      expect(rawContent).toContain('audit');
    });
    
    it('should include guidance on writing clear titles', () => {
      expect(rawContent).toContain('**Write clear titles**');
      expect(rawContent).toContain('action-oriented');
    });
    
    it('should include comprehensive example of issue creation', () => {
      expect(rawContent).toContain('mcp__createIssue');
      expect(rawContent).toContain('Success criteria');
      expect(rawContent).toContain('+unit-test'); // Tag templates in tasks
    });
    
    it('should include guidance on task sequencing and dependencies', () => {
      expect(rawContent).toContain('## Effective Ticket Planning Strategies');
      expect(rawContent).toContain('Task Sequencing and Dependencies');
    });
  });
  
  // Testing developer documentation
  describe('Developer Role', () => {
    let devDoc;
    let rawContent;
    
    beforeAll(async () => {
      // Load the developer documentation via the parser
      devDoc = loadRoleDoc('developer');
      
      // Also read the raw file for more detailed testing
      rawContent = await readMarkdownFile(path.join(docsDir, 'developer.md'));
    });
    
    it('should include working with tickets and tasks section', () => {
      expect(rawContent).toContain('## Working with Tickets and Tasks');
      expect(rawContent).toContain('Ticket and Task Lifecycle');
    });
    
    it('should include task implementation best practices', () => {
      expect(rawContent).toContain('## Task Implementation Best Practices');
      expect(rawContent).toContain('Before Implementation');
      expect(rawContent).toContain('During Implementation');
      expect(rawContent).toContain('After Implementation');
    });
    
    it('should include detailed tool usage guidance', () => {
      expect(rawContent).toContain('## Developer Tool Usage Guide');
      expect(rawContent).toContain('Task Management Tools');
      expect(rawContent).toContain('Documentation and Communication Tools');
    });
    
    it('should include comprehensive tag template guidance', () => {
      expect(rawContent).toContain('## Working with Tag Templates');
      expect(rawContent).toContain('Understanding Tag Workflows');
      expect(rawContent).toContain('+unit-test');
      expect(rawContent).toContain('+e2e-test');
      expect(rawContent).toContain('+lint-and-commit');
      expect(rawContent).toContain('+update-docs');
    });
    
    it('should include practical workflow example', () => {
      expect(rawContent).toContain('Task Workflows in Practice');
      expect(rawContent).toContain('Get your current task');
      expect(rawContent).toContain('See the expanded subtasks');
      expect(rawContent).toContain('standardized workflows');
    });
  });
  
  // Testing reviewer documentation
  describe('Reviewer Role', () => {
    let reviewerDoc;
    let rawContent;
    
    beforeAll(async () => {
      // Load the reviewer documentation via the parser
      reviewerDoc = loadRoleDoc('reviewer');
      
      // Also read the raw file for more detailed testing
      rawContent = await readMarkdownFile(path.join(docsDir, 'reviewer.md'));
    });
    
    it('should include tag template usage guidance', () => {
      expect(rawContent).toContain('**Use tag templates**');
      expect(rawContent).toContain('+tag-name');
    });
    
    it('should include section on using tag templates in reviews', () => {
      expect(rawContent).toContain('## Using Tag Templates in Reviews');
      expect(rawContent).toContain('Common Review Templates');
    });
    
    it('should include examples of template usage in review tasks', () => {
      expect(rawContent).toContain('+unit-test');
      expect(rawContent).toContain('+e2e-test');
      expect(rawContent).toContain('+update-docs');
    });
  });
  
  // Testing tag template documentation
  describe('Tag Template Documentation', () => {
    let tagTemplatesContent;
    
    beforeAll(async () => {
      // Read the tag templates documentation
      tagTemplatesContent = await readMarkdownFile(
        path.join(projectRoot, 'docs/ai/tool-examples/tag-templates.md')
      );
    });
    
    it('should include comprehensive tag template documentation', () => {
      expect(tagTemplatesContent).toContain('# Tag Templates Guide');
      expect(tagTemplatesContent).toContain('Discovering Available Templates');
      expect(tagTemplatesContent).toContain('Adding Tags to Tasks');
      expect(tagTemplatesContent).toContain('Available Tag Templates');
    });
    
    it('should document all standard tag templates', () => {
      expect(tagTemplatesContent).toContain('### Unit Testing (+unit-test)');
      expect(tagTemplatesContent).toContain('### End-to-End Testing (+e2e-test)');
      expect(tagTemplatesContent).toContain('### Code Quality (+lint-and-commit)');
      expect(tagTemplatesContent).toContain('### Documentation (+update-docs)');
    });
    
    it('should include best practices for tag usage', () => {
      expect(tagTemplatesContent).toContain('## Best Practices');
      expect(tagTemplatesContent).toContain('Choose the appropriate template');
    });
    
    it('should include examples of combining templates', () => {
      expect(tagTemplatesContent).toContain('## Examples');
      expect(tagTemplatesContent).toContain('Implementing a New Feature with Testing');
      expect(tagTemplatesContent).toContain('Fixing a Bug with Documentation Update');
    });
  });
});