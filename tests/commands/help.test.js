// Tests for help command

const { discoverDocFiles, formatMarkdownForTerminal } = require('../../src/commands/help');
const outputManager = require('../../src/utils/outputManager');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../src/utils/outputManager');

// Get the mocked modules
const fs = require('fs');
const path = require('path');

describe('Help command', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup path.join mock to return predictable paths
    path.join.mockImplementation((...parts) => parts.join('/'));
    
    // Mock directory structure
    const mockDirs = {
      'src/commands/../../docs': ['getting-started.md', 'environment-variables.md', 'tutorials'],
      'src/commands/../../docs/tutorials': ['basic-workflow.md', 'advanced.md']
    };
    
    // Make fs.readdirSync return our mock structure
    fs.readdirSync.mockImplementation(dir => {
      return mockDirs[dir] || [];
    });
    
    // Make fs.existsSync return true for our directories
    fs.existsSync.mockImplementation(dir => {
      return Object.keys(mockDirs).includes(dir) || dir.endsWith('.md');
    });
    
    // Make fs.statSync return isDirectory true for directories
    fs.statSync.mockImplementation(path => ({
      isDirectory: () => path.includes('tutorials') && !path.endsWith('.md')
    }));
    
    // Mock file content
    fs.readFileSync.mockImplementation(file => {
      if (file.includes('getting-started')) {
        return '# Getting Started\n\nThis is a test file.';
      } else if (file.includes('environment-variables')) {
        return '# Environment Variables\n\nThis is about env vars.';
      } else if (file.includes('basic-workflow')) {
        return '# Basic Workflow\n\nThis is a tutorial.';
      } else if (file.includes('advanced')) {
        return '# Advanced Features\n\nAdvanced tutorial content.';
      }
      return '';
    });
  });
  
  describe('discoverDocFiles', () => {
    it('should discover markdown files and include env built-in topic', () => {
      const result = discoverDocFiles();
      
      // Should have general category with env
      expect(result).toHaveProperty('general');
      
      // Env topic should be included
      const generalFiles = result.general.map(doc => doc.name);
      expect(generalFiles).toContain('env');
    });
  });
  
  describe('formatMarkdownForTerminal', () => {
    it('should format headings properly', () => {
      const markdown = '# Main Heading\n\n## Subheading\n\n### Section';
      const result = formatMarkdownForTerminal(markdown);
      
      // The function should transform headings with formatting
      expect(result).toContain('Main Heading');
      expect(result).toContain('Subheading');
      expect(result).toContain('Section');
    });
    
    it('should format code blocks', () => {
      const markdown = '```bash\nnpm install\n```';
      const result = formatMarkdownForTerminal(markdown);
      
      // Should contain the code content
      expect(result).toContain('npm install');
    });
    
    it('should format lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = formatMarkdownForTerminal(markdown);
      
      // Should contain list items with bullet points
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
      expect(result).toContain('•'); // Bullet character
    });
  });
});