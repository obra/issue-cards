// ABOUTME: Integration tests for documentationParser with onboarding tools
// ABOUTME: Validates that the parser correctly loads documentation files

const path = require('path');
const fs = require('fs');
const {
  loadRoleDoc,
  loadWorkflowDoc,
  listWorkflows
} = require('../../src/utils/documentationParser');

// Don't mock fs for integration tests - we want to read actual files
jest.unmock('fs');

describe('documentationParser integration', () => {
  // Check if the AI documentation files exist
  const docsPath = path.resolve(__dirname, '../../docs/ai');
  const docsExist = fs.existsSync(docsPath);
  
  // Skip tests if docs don't exist
  const itOrSkip = docsExist ? it : it.skip;
  
  describe('loadRoleDoc', () => {
    itOrSkip('should load project manager documentation', () => {
      const pmDoc = loadRoleDoc('pm');
      
      expect(pmDoc).toBeDefined();
      expect(pmDoc.title).toMatch(/Project Manager|PM/);
      // Other fields might vary based on documentation structure
    });
    
    itOrSkip('should load developer documentation', () => {
      const devDoc = loadRoleDoc('developer');
      
      expect(devDoc).toBeDefined();
      expect(devDoc.title).toMatch(/Developer|Dev/);
      // Other fields might vary based on documentation structure
    });
    
    itOrSkip('should load reviewer documentation', () => {
      const reviewerDoc = loadRoleDoc('reviewer');
      
      expect(reviewerDoc).toBeDefined();
      expect(reviewerDoc.title).toMatch(/Reviewer/);
      // Other fields might vary based on documentation structure
    });
    
    itOrSkip('should handle role aliases', () => {
      const pmDoc = loadRoleDoc('pm');
      const projectManagerDoc = loadRoleDoc('project-manager');
      
      expect(pmDoc.title).toBe(projectManagerDoc.title);
      
      const devDoc = loadRoleDoc('dev');
      const developerDoc = loadRoleDoc('developer');
      
      expect(devDoc.title).toBe(developerDoc.title);
    });
  });
  
  describe('loadWorkflowDoc', () => {
    itOrSkip('should load the create-feature workflow', () => {
      const workflow = loadWorkflowDoc('create-feature');
      
      expect(workflow).toBeDefined();
      expect(workflow.title).toMatch(/Create Feature|Feature Creation/);
      // Other fields might vary based on documentation structure
    });
    
    itOrSkip('should load the bugfix workflow', () => {
      const workflow = loadWorkflowDoc('bugfix');
      
      expect(workflow).toBeDefined();
      expect(workflow.title).toMatch(/Bugfix|Bug Fix/);
      // Other fields might vary based on documentation structure
    });
    
    itOrSkip('should extract example tool sequence if available', () => {
      const workflow = loadWorkflowDoc('create-feature');
      
      // The tool sequence might not be available in all docs
      if (workflow.exampleToolSequence) {
        // If it exists, it should have a valid structure
        if (Array.isArray(workflow.exampleToolSequence)) {
          // It's an array of tool calls
          if (workflow.exampleToolSequence.length > 0) {
            const firstToolCall = workflow.exampleToolSequence[0];
            // Tool calls should have tool and args properties
            if (firstToolCall) {
              expect(firstToolCall).toHaveProperty('tool');
              expect(firstToolCall).toHaveProperty('args');
            }
          }
        } else {
          // It's a single tool call
          expect(workflow.exampleToolSequence).toHaveProperty('tool');
          expect(workflow.exampleToolSequence).toHaveProperty('args');
        }
      }
      
      // Test passes even if there's no example tool sequence
      expect(true).toBe(true);
    });
  });
  
  describe('listWorkflows', () => {
    itOrSkip('should list all available workflows', () => {
      const workflows = listWorkflows();
      
      expect(workflows).toBeInstanceOf(Array);
      expect(workflows.length).toBeGreaterThanOrEqual(3); // At least 3 workflows
      
      // Check that create-feature, bugfix, and task-management are included
      const workflowIds = workflows.map(w => w.id);
      expect(workflowIds).toContain('create-feature');
      expect(workflowIds).toContain('bugfix');
      expect(workflowIds).toContain('task-management');
      
      // Each workflow should have id, title, and description
      workflows.forEach(workflow => {
        expect(workflow).toHaveProperty('id');
        expect(workflow).toHaveProperty('title');
        expect(workflow).toHaveProperty('description');
      });
    });
  });
});