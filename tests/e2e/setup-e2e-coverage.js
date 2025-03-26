// Setup file for E2E coverage testing
// This file helps with instrumenting code coverage for E2E tests

// Enable source maps to get accurate line numbers
require('source-map-support').install();

// Add a direct import wrapper to e2eHelpers
const path = require('path');
global.directModuleImport = (modulePath) => {
  // Convert a relative path like '../src/commands/show.js' to an absolute path
  const absolutePath = path.resolve(__dirname, '../../', modulePath);
  return require(absolutePath);
};

// Mocks for child_process to track coverage when possible
jest.mock('child_process', () => {
  const original = jest.requireActual('child_process');
  
  // When using spawnSync, track coverage if requested
  const spawnSync = (cmd, args, options) => {
    // If this is our CLI, and we're trying to test coverage directly, don't spawn
    if (cmd === 'node' && args[0].includes('issue-cards.js') && process.env.DIRECT_COVERAGE === 'true') {
      // Instead, require the CLI and run it directly
      const cli = require('../../bin/issue-cards.js');
      // Mock process.exit so it doesn't terminate the test
      const originalExit = process.exit;
      process.exit = jest.fn();
      
      try {
        // Execute the CLI directly
        process.argv = [process.argv[0], process.argv[1], ...args.slice(1)];
        // This will run the CLI in the same process, so coverage will be collected
        cli();
        return { 
          status: 0, 
          stdout: '', 
          stderr: ''
        };
      } catch (error) {
        return {
          status: 1,
          stdout: '',
          stderr: error.message
        };
      } finally {
        process.exit = originalExit;
      }
    }
    
    // Otherwise, use the original
    return original.spawnSync(cmd, args, options);
  };
  
  return {
    ...original,
    spawnSync
  };
});