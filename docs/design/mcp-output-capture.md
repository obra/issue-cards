# MCP Output Capture Design Document

## Problem Statement

We need to capture command output that normally goes to the console for use in MCP tools. This output needs to be:
1. Structured for programmatic access
2. Available for return in API responses
3. Configurable (console display vs. suppressed)
4. Compatible with our existing output manager

## Current State

The output manager (`src/utils/outputManager.js`) already has basic output capture functionality:

1. It can be configured with `captureOutput: true`
2. It stores output in a structured format by type (success, info, warning, error, debug, data, raw)
3. It provides a `getCapturedOutput()` method to retrieve the data
4. It has a `reset()` method to clear captured output

When the MCP server executes a command via `executeCommand()` in `src/index.js`, it:
1. Configures the output manager with `json: true`, `quiet: true`, and `captureOutput: true`
2. Executes the command
3. Retrieves the captured output
4. Resets the output manager

## Design Goals

1. **Simplify the mental model**: Always capture output, just decide whether to display it
2. **Structured data capture**: Capture output in a format that can be easily used by API clients
3. **Console suppression**: Option to prevent output to console when needed
4. **Command separation**: Track output for different commands separately
5. **Format adaptability**: Support transforming output to different formats
6. **Nested execution**: Handle nested command execution with proper output inheritance

## Implementation Approach

### 1. Always-On Output Capture

Modify the output manager to always capture output rather than making it optional:

```javascript
// In outputManager.js
let config = {
  verbosity: VERBOSITY.NORMAL,
  useColors: true,
  jsonOutput: false,
  suppressConsole: false  // New option replacing captureOutput
};

// Capture store always initialized
let capturedOutput = {
  success: [],
  info: [],
  warning: [],
  error: [],
  debug: [],
  data: {},
  raw: []
};
```

This simplifies the mental model - output is always captured, and we just decide whether to display it.

### 2. Updated Output Methods

Modify all output methods to always capture and conditionally display:

```javascript
function success(message, options = {}) {
  // Always capture
  capturedOutput.success.push(message);
  
  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'success', message }));
    } else {
      console.log(formatSuccessMsg(message, options));
    }
  }
}

// Similar changes to all other output methods
```

### 3. Command Context Tracking

Add support for tracking output by command context:

```javascript
// Store for captured output by command
let commandOutputs = {};

// Current command context
let currentCommand = null;

/**
 * Set the current command context
 * 
 * @param {string} commandName - The name of the command
 */
function setCommandContext(commandName) {
  currentCommand = commandName;
  
  // Initialize command output store if needed
  if (commandName && !commandOutputs[commandName]) {
    commandOutputs[commandName] = {
      success: [],
      info: [],
      warning: [],
      error: [],
      debug: [],
      data: {},
      raw: []
    };
  }
}

/**
 * Get output for a specific command
 * 
 * @param {string} commandName - The name of the command
 * @returns {Object} The captured output for the command
 */
function getCommandOutput(commandName) {
  return commandOutputs[commandName] 
    ? JSON.parse(JSON.stringify(commandOutputs[commandName]))
    : null;
}

/**
 * Reset output for a specific command
 * 
 * @param {string} commandName - The name of the command
 */
function resetCommandOutput(commandName) {
  if (commandOutputs[commandName]) {
    delete commandOutputs[commandName];
  }
}
```

### 4. Enhanced Output Capture

Update each output method to also track by command context:

```javascript
function success(message, options = {}) {
  // Always capture in global store
  capturedOutput.success.push(message);
  
  // Also capture in command-specific store if a command context is set
  if (currentCommand) {
    commandOutputs[currentCommand].success.push(message);
  }
  
  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'success', message }));
    } else {
      console.log(formatSuccessMsg(message, options));
    }
  }
}
```

### 5. Output Format Transformation

Add utility functions for transforming captured output:

```javascript
/**
 * Transform captured output to a simple format
 * 
 * @param {Object} output - The captured output
 * @returns {Array} Simple format array of messages
 */
function toSimpleFormat(output) {
  const result = [];
  
  // Add all messages
  output.success.forEach(msg => result.push({ type: 'success', message: msg }));
  output.info.forEach(msg => result.push({ type: 'info', message: msg }));
  output.warning.forEach(msg => result.push({ type: 'warning', message: msg }));
  output.error.forEach(msg => result.push({ type: 'error', message: msg }));
  output.debug.forEach(msg => result.push({ type: 'debug', message: msg }));
  
  // Add section data
  Object.entries(output.data).forEach(([title, content]) => {
    result.push({ type: 'section', title, content });
  });
  
  // Add raw output
  output.raw.forEach(content => result.push({ type: 'raw', content }));
  
  return result;
}

/**
 * Transform captured output to markdown
 * 
 * @param {Object} output - The captured output
 * @returns {string} Markdown representation
 */
function toMarkdown(output) {
  let result = '';
  
  // Add sections as headers
  Object.entries(output.data).forEach(([title, content]) => {
    result += `## ${title}\n\n`;
    if (Array.isArray(content)) {
      content.forEach(line => {
        result += `${line}\n`;
      });
    } else {
      result += `${content}\n`;
    }
    result += '\n';
  });
  
  // Add success messages
  if (output.success.length > 0) {
    result += '## Success\n\n';
    output.success.forEach(msg => {
      result += `✅ ${msg}\n`;
    });
    result += '\n';
  }
  
  // Add errors and warnings
  if (output.error.length > 0 || output.warning.length > 0) {
    result += '## Issues\n\n';
    output.error.forEach(err => {
      result += `❌ ${typeof err === 'object' ? err.message : err}\n`;
    });
    output.warning.forEach(warn => {
      result += `⚠️ ${warn}\n`;
    });
    result += '\n';
  }
  
  return result.trim();
}
```

### 6. MCP Server Integration

Update the `executeCommand` function in `src/index.js` to use the improved output capture:

```javascript
async function executeCommand(commandName, args = {}) {
  try {
    // Reset output manager
    outputManager.reset();
    
    // Set command context
    outputManager.setCommandContext(commandName);
    
    // Configure output manager
    outputManager.configure({ 
      json: true, 
      quiet: args.quiet || false,
      suppressConsole: args.suppressConsole || false,
      // No need for captureOutput flag - always on
    });
    
    // Create the program and execute command
    // ...
    
    // Get the captured output
    const output = outputManager.getCommandOutput(commandName);
    
    // Transform output if format specified
    const formattedOutput = args.outputFormat 
      ? outputManager.transformOutput(output, args.outputFormat)
      : output;
    
    // Reset command output
    outputManager.resetCommandOutput(commandName);
    
    return {
      success: true,
      data: formattedOutput
    };
  } catch (error) {
    // Error handling...
  }
}
```

## API Changes

The enhanced output capture will provide new API endpoints and options:

1. **POST /api/tools/execute**: Add new options
   ```json
   {
     "tool": "list",
     "args": {
       "path": "./issues/open"
     },
     "options": {
       "suppressConsole": true,
       "outputFormat": "markdown"
     }
   }
   ```

## Migration Plan

1. **Phase 1**: Update `outputManager.js` to always capture output and add `suppressConsole` option
2. **Phase 2**: Add command context tracking and command-specific output storage
3. **Phase 3**: Implement output transformation functions 
4. **Phase 4**: Update `executeCommand` to use new features
5. **Phase 5**: Update API endpoints to support new options

## Testing Strategy

1. **Unit Tests**: 
   - Test that output is always captured regardless of display settings
   - Test command context tracking
   - Test transformation functions
   - Test console suppression

2. **Integration Tests**: 
   - Test the integration with the MCP server
   - Test output capture in API responses
   - Test different output formats

3. **End-to-End Tests**: 
   - Test real commands with output capture
   - Test nested command execution

## Benefits of this Approach

1. **Simplifies the mental model** - Output is always captured, and you just decide whether to display it
2. **Reduces bugs** - No risk of forgetting to enable capture when needed
3. **Cleaner separation of concerns** - Separates "what happens to output" from "should we show output"
4. **Fewer configuration options** - Removes an entire dimension of configuration
5. **More aligned with MCP server needs** - Natural fit for making command output available programmatically

## Conclusion

By making output capture always active and adding command context tracking, we create a simpler, more predictable system. The approach leverages our existing output manager while making it more suitable for MCP server integration and API responses.