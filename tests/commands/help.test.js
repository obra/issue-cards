// Tests for help command

const { listTopics } = require('../../src/commands/help');
const outputManager = require('../../src/utils/outputManager');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../src/utils/outputManager');
jest.mock('chalk', () => ({
  bold: {
    cyan: jest.fn(text => text),
    green: jest.fn(text => text)
  },
  gray: jest.fn(text => text),
  yellow: jest.fn(text => text),
  blue: jest.fn(text => text),
  green: jest.fn(text => text)
}));

// Get the mocked modules
const fs = require('fs');
const path = require('path');

describe('Help command with new documentation structure', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup path.join mock to return predictable paths
    path.join.mockImplementation((...parts) => parts.join('/'));
    
    // Mock directory structure
    const mockDirs = {
      'src/commands/../../docs': ['getting-started.md', 'tutorials', 'guides', 'reference', 'design'],
      'src/commands/../../docs/tutorials': ['basic-workflow.md', 'index.md'],
      'src/commands/../../docs/guides': ['git-integration.md', 'index.md'],
      'src/commands/../../docs/reference': ['environment-vars.md', 'index.md'],
      'src/commands/../../docs/design': ['command-update-plan.md', 'index.md']
    };
    
    // Setup fs mocks
    fs.readdirSync.mockImplementation(dir => {
      if (mockDirs[dir]) {
        return mockDirs[dir];
      }
      return [];
    });
    
    fs.existsSync.mockImplementation(dir => {
      return Object.keys(mockDirs).includes(dir) || dir.endsWith('.md');
    });
    
    fs.statSync.mockImplementation(path => {
      const isDirectory = path.includes('tutorials') || 
                          path.includes('guides') || 
                          path.includes('reference') || 
                          path.includes('design');
      
      return {
        isDirectory: () => isDirectory && !path.endsWith('.md')
      };
    });
    
    fs.readFileSync.mockImplementation(file => {
      if (file.includes('index')) {
        return '# Index\n\nIndex content.';
      }
      return '# Mock Title\n\nMock content';
    });
  });
  
  it('should display all documentation categories in the output', () => {
    // Call listTopics to trigger the output
    listTopics();
    
    // Verify categories are displayed
    expect(outputManager.subheader).toHaveBeenCalledWith('Commands');
    expect(outputManager.subheader).toHaveBeenCalledWith('General');
    expect(outputManager.subheader).toHaveBeenCalledWith('Tutorials');
    expect(outputManager.subheader).toHaveBeenCalledWith('Guides');
    expect(outputManager.subheader).toHaveBeenCalledWith('Reference');
    expect(outputManager.subheader).toHaveBeenCalledWith('Design');
  });
});