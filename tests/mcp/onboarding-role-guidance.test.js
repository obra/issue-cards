// ABOUTME: Integration tests for role-specific onboarding guidance
// ABOUTME: Verifies that MCP tools deliver proper role-specific content

const { 
  mcp__onboarding, 
  mcp__pm, 
  mcp__dev, 
  mcp__reviewer,
  mcp__availableTags
} = require('../../src/mcp/onboardingTools');

// This test uses the real documentation parser with actual content files
jest.unmock('../../src/utils/documentationParser');

describe('Role-specific Onboarding Guidance', () => {
  describe('Generic onboarding tool with role parameter', () => {
    it('should return PM-specific guidance when pm role is specified', async () => {
      const result = await mcp__onboarding({ role: 'pm' });
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Project Manager Onboarding');
      expect(result.data.description).toContain('project manager');
      expect(result.data.workflows).toBeInstanceOf(Array);
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      
      // Check for PM-specific workflows
      const workflowNames = result.data.workflows.map(w => w.name);
      expect(workflowNames).toContain('Create Feature Issue');
      
      // Check for PM-specific best practices - we should look at general structure
      // rather than specific content since the parser only extracts from the "Best Practices" section
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      expect(result.data.bestPractices.length).toBeGreaterThan(0);
    });
    
    it('should return Developer-specific guidance when developer role is specified', async () => {
      const result = await mcp__onboarding({ role: 'developer' });
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Developer Onboarding');
      expect(result.data.description).toContain('developer');
      expect(result.data.workflows).toBeInstanceOf(Array);
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      
      // Check for Developer-specific workflows
      const workflowNames = result.data.workflows.map(w => w.name);
      expect(workflowNames).toContain('Task Management');
      
      // Check for Developer-specific content
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      expect(result.data.bestPractices.length).toBeGreaterThan(0);
    });
    
    it('should return Reviewer-specific guidance when reviewer role is specified', async () => {
      const result = await mcp__onboarding({ role: 'reviewer' });
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Reviewer Onboarding');
      expect(result.data.description).toContain('reviewer');
      expect(result.data.workflows).toBeInstanceOf(Array);
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      
      // Check for Reviewer-specific workflows
      const workflowNames = result.data.workflows.map(w => w.name);
      expect(workflowNames).toContain('Review Process');
      
      // Check for Reviewer-specific content
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      expect(result.data.bestPractices.length).toBeGreaterThan(0);
    });
    
    it('should include tag templates with descriptions in onboarding response', async () => {
      const result = await mcp__onboarding({ role: 'developer' });
      
      expect(result.success).toBe(true);
      expect(result.data.tagTemplates).toBeInstanceOf(Array);
      expect(result.data.tagTemplates.length).toBeGreaterThan(0);
      
      // Check tag template structure
      const firstTemplate = result.data.tagTemplates[0];
      expect(firstTemplate).toHaveProperty('name');
      expect(firstTemplate).toHaveProperty('description');
      expect(firstTemplate.description.length).toBeGreaterThan(10); // Should have a meaningful description
    });
  });
  
  describe('Role-specific alias tools', () => {
    it('mcp__pm should return Project Manager guidance', async () => {
      const result = await mcp__pm({});
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Project Manager Onboarding');
      
      // Should include best practices guidance
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      expect(result.data.bestPractices.length).toBeGreaterThan(0);
    });
    
    it('mcp__dev should return Developer guidance', async () => {
      const result = await mcp__dev({});
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Developer Onboarding');
      
      // Should include best practices
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      expect(result.data.bestPractices.length).toBeGreaterThan(0);
    });
    
    it('mcp__reviewer should return Reviewer guidance', async () => {
      const result = await mcp__reviewer({});
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Reviewer Onboarding');
      
      // Should include best practices
      expect(result.data.bestPractices).toBeInstanceOf(Array);
      expect(result.data.bestPractices.length).toBeGreaterThan(0);
    });
  });
  
  describe('Tag template discovery tool', () => {
    it('mcp__availableTags should return all tag templates with descriptions', async () => {
      const result = await mcp__availableTags({});
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Available Tag Templates');
      expect(result.data.description).toContain('standardized workflows');
      expect(result.data.tagTemplates).toBeInstanceOf(Array);
      expect(result.data.tagTemplates.length).toBeGreaterThan(0);
      
      // Check that all common templates are included
      const templateNames = result.data.tagTemplates.map(t => t.name);
      expect(templateNames).toContain('unit-test');
      expect(templateNames).toContain('e2e-test');
      expect(templateNames).toContain('lint-and-commit');
      expect(templateNames).toContain('update-docs');
      
      // Check that templates have descriptions
      const unitTestTemplate = result.data.tagTemplates.find(t => t.name === 'unit-test');
      expect(unitTestTemplate).toBeDefined();
      expect(unitTestTemplate.description).toBeDefined();
      expect(unitTestTemplate.description.length).toBeGreaterThan(0);
    });
    
    it('should include usage examples in tag template response', async () => {
      const result = await mcp__availableTags({});
      
      expect(result.success).toBe(true);
      expect(result.data.usage).toBeDefined();
      expect(result.data.usage.example).toBeDefined();
      expect(result.data.usage.description).toBeDefined();
      expect(result.data.usage.example).toContain('+');
    });
  });
});