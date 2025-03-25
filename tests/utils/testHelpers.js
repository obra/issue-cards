// ABOUTME: Test helper utilities for Issue Cards
// ABOUTME: Provides mock functions and testing shortcuts

/**
 * Mock console methods and capture output
 * 
 * @returns {Object} Object with captured stdout, stderr and cleanup method
 */
function mockConsole() {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleDebug = console.debug;
  
  // Capture buffers
  let stdoutBuffer = [];
  let stderrBuffer = [];
  
  // Mock console methods
  console.log = jest.fn((...args) => {
    stdoutBuffer.push(args.join(' '));
  });
  
  console.error = jest.fn((...args) => {
    stderrBuffer.push(args.join(' '));
  });
  
  console.info = jest.fn((...args) => {
    stdoutBuffer.push(args.join(' '));
  });
  
  console.warn = jest.fn((...args) => {
    stderrBuffer.push(args.join(' '));
  });
  
  console.debug = jest.fn((...args) => {
    stderrBuffer.push(args.join(' '));
  });
  
  // Return captured output and cleanup method
  return {
    stdout: () => stdoutBuffer,
    stderr: () => stderrBuffer,
    stdoutString: () => stdoutBuffer.join('\n'),
    stderrString: () => stderrBuffer.join('\n'),
    cleanup: () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.info = originalConsoleInfo;
      console.warn = originalConsoleWarn;
      console.debug = originalConsoleDebug;
    }
  };
}

/**
 * Mock the output manager for testing
 * 
 * @returns {Object} Object with mocked output manager and captured output
 */
function mockOutputManager() {
  // Create mock functions and capture storage upfront
  const capturedOutput = {
    stdout: [],
    stderr: [],
    all: [],
  };
  
  // Create a mock for each method
  const mockMethod = (stream, type) => jest.fn((...args) => {
    const message = args[0]; // First argument is always the message
    capturedOutput[stream].push({ type, message });
    capturedOutput.all.push({ stream, type, message });
  });
  
  // Mock object with all the methods
  const mockOutput = {
    // Configuration
    configure: jest.fn(),
    VERBOSITY: {
      QUIET: 0,
      NORMAL: 1,
      VERBOSE: 2,
      DEBUG: 3
    },
    
    // Output methods - stdout
    success: mockMethod('stdout', 'success'),
    info: mockMethod('stdout', 'info'),
    section: mockMethod('stdout', 'section'),
    list: mockMethod('stdout', 'list'),
    table: mockMethod('stdout', 'table'),
    raw: mockMethod('stdout', 'raw'),
    blank: mockMethod('stdout', 'blank'),
    
    // Output methods - stderr
    warn: mockMethod('stderr', 'warn'),
    error: mockMethod('stderr', 'error'),
    debug: mockMethod('stderr', 'debug'),
    
    // Formatting helpers (these don't capture, just format)
    formatSuccessMsg: jest.fn(msg => `✅ ${msg}`),
    formatErrorMsg: jest.fn(msg => `❌ ${msg}`),
    formatWarningMsg: jest.fn(msg => `⚠️ ${msg}`),
    formatInfoMsg: jest.fn(msg => `ℹ️ ${msg}`),
    formatDebugMsg: jest.fn(msg => `🐞 ${msg}`),
    formatSectionMsg: jest.fn((title, content) => `${title}:\n${content}`),
    standardize: jest.fn(text => text.trim() + '\n'),
    
    // Test helpers
    _captured: capturedOutput,
    _reset: () => {
      capturedOutput.stdout = [];
      capturedOutput.stderr = [];
      capturedOutput.all = [];
      
      // Reset all mocks
      Object.keys(mockOutput).forEach(key => {
        if (typeof mockOutput[key] === 'function' && mockOutput[key].mockClear) {
          mockOutput[key].mockClear();
        }
      });
    }
  };
  
  // We don't mock the module here, since we'd need to do it before the test dependencies are loaded
  // Instead, return the mock and let the test file handle the mocking
  return mockOutput;
}

module.exports = {
  mockConsole,
  mockOutputManager,
};