// ABOUTME: Tests for ticket navigation documentation
// ABOUTME: Verifies documentation for navigating between tickets and tasks

const fs = require('fs');
const path = require('path');

describe('Ticket Navigation Documentation', () => {
  const navigationDocPath = path.join(__dirname, '../../docs/reference/ticket-navigation.md');
  const taskManagementPath = path.join(__dirname, '../../docs/ai/workflows/task-management.md');
  
  let navigationDocContent;
  let taskManagementContent;
  
  beforeAll(() => {
    navigationDocContent = fs.existsSync(navigationDocPath) ? 
      fs.readFileSync(navigationDocPath, 'utf8') : '';
    
    taskManagementContent = fs.existsSync(taskManagementPath) ? 
      fs.readFileSync(taskManagementPath, 'utf8') : '';
  });
  
  describe('Ticket Navigation Reference Documentation', () => {
    it('should have a ticket navigation documentation file', () => {
      expect(fs.existsSync(navigationDocPath)).toBe(true);
    });
    
    it('should explain navigation between tickets and tasks', () => {
      expect(navigationDocContent).toContain('MCP Workflow Navigation');
      expect(navigationDocContent).toContain('Ticket Navigation Principles');
      expect(navigationDocContent).toContain('Navigating Between Issues');
      expect(navigationDocContent).toContain('Navigating Between Tasks');
    });
    
    it('should include examples of MCP commands for navigation', () => {
      expect(navigationDocContent).toContain('mcp__listIssues');
      expect(navigationDocContent).toContain('mcp__setCurrentIssue');
      expect(navigationDocContent).toContain('mcp__getCurrentTask');
      expect(navigationDocContent).toContain('mcp__completeTask');
    });
    
    it('should include navigation patterns and diagrams', () => {
      expect(navigationDocContent).toContain('Navigation Flow Diagrams');
      expect(navigationDocContent).toContain('┌─────');
      expect(navigationDocContent).toContain('└─────');
    });
    
    it('should cover different navigation scenarios', () => {
      expect(navigationDocContent).toContain('Common Navigation Scenarios');
      expect(navigationDocContent).toContain('Scenario 1');
      expect(navigationDocContent).toContain('Scenario 2');
    });
    
    it('should address error handling in navigation', () => {
      expect(navigationDocContent).toContain('Handling Navigation Errors');
      expect(navigationDocContent).toContain('Error Types');
      expect(navigationDocContent).toContain('Error Recovery Strategies');
    });
  });
  
  describe('Task Management Workflow Documentation', () => {
    it('should have a task management workflow document', () => {
      expect(fs.existsSync(taskManagementPath)).toBe(true);
    });
    
    it('should include a section on navigating between issues and tasks', () => {
      expect(taskManagementContent).toContain('Navigating Between Issues and Tasks');
      expect(taskManagementContent).toContain('Issue Navigation');
      expect(taskManagementContent).toContain('Task Navigation');
    });
    
    it('should include navigation scenarios', () => {
      expect(taskManagementContent).toContain('Navigation Scenarios');
      expect(taskManagementContent).toContain('Scenario 1: Starting Work on a New Project');
      expect(taskManagementContent).toContain('Scenario 2: Completing a Task and Moving to the Next');
      expect(taskManagementContent).toContain('Scenario 3: Moving to a Different Issue');
    });
    
    it('should include navigation best practices', () => {
      expect(taskManagementContent).toContain('Navigation Best Practices');
    });
    
    it('should reference the ticket navigation documentation', () => {
      expect(taskManagementContent).toContain('Ticket Navigation');
      expect(taskManagementContent).toContain('../../reference/ticket-navigation.md');
    });
  });
  
  describe('Documentation Cross-References', () => {
    const referenceIndexPath = path.join(__dirname, '../../docs/reference/index.md');
    const aiIndexPath = path.join(__dirname, '../../docs/ai/index.md');
    
    let referenceIndexContent;
    let aiIndexContent;
    
    beforeAll(() => {
      referenceIndexContent = fs.existsSync(referenceIndexPath) ? 
        fs.readFileSync(referenceIndexPath, 'utf8') : '';
      
      aiIndexContent = fs.existsSync(aiIndexPath) ? 
        fs.readFileSync(aiIndexPath, 'utf8') : '';
    });
    
    it('should include the ticket navigation in the reference index', () => {
      expect(referenceIndexContent).toContain('Ticket Navigation');
      expect(referenceIndexContent).toContain('ticket-navigation.md');
    });
    
    it('should mention navigation in the task management workflow description in the AI index', () => {
      expect(aiIndexContent).toContain('Working through individual tasks and navigating between issues');
    });
  });
});