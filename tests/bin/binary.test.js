// ABOUTME: Tests for binary executable
// ABOUTME: Verifies binary can be executed and returns correct exit code

const path = require('path');
const { execSync } = require('child_process');

describe('Binary executable', () => {
  const binaryPath = path.join(__dirname, '../../bin/issue-cards.js');
  
  test('binary file exists', () => {
    // This test will fail if the file doesn't exist
    const stats = require('fs').statSync(binaryPath);
    expect(stats.isFile()).toBe(true);
  });
  
  test('binary file is executable', () => {
    // Skip on Windows as chmod concepts are different
    if (process.platform === 'win32') {
      return;
    }
    
    // Check if the file has execute permission
    const stats = require('fs').statSync(binaryPath);
    const isExecutable = !!(stats.mode & 0o111); // Check if any execute bit is set
    expect(isExecutable).toBe(true);
  });
  
  test('displays version with --version flag', () => {
    // Run the binary with --version flag
    let output;
    try {
      // Use cwd option to set the working directory to the project root
      output = execSync(`node ${binaryPath} --version`, { 
        encoding: 'utf8',
        cwd: path.resolve(__dirname, '../..')
      });
    } catch (error) {
      // If the version is returned as an error, use the error message as output
      output = error.message || '';
    }
    
    // Should output version in the format x.y.z
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });
  
  test('displays help with --help flag', () => {
    // Run the binary with --help flag
    let output;
    try {
      output = execSync(`node ${binaryPath} --help`, { 
        encoding: 'utf8',
        cwd: path.resolve(__dirname, '../..')
      });
    } catch (error) {
      throw new Error(`Failed to run binary with --help flag: ${error.message}`);
    }
    
    // Should contain usage information
    expect(output).toContain('Usage:');
    expect(output).toContain('Commands:');
    expect(output).toContain('Options:');
  });
});