// ABOUTME: Centralized output management system
// ABOUTME: Handles all console output with consistent formatting and stream usage

const chalk = require('chalk');

// Verbosity levels
const VERBOSITY = {
  QUIET: 0,
  NORMAL: 1,
  VERBOSE: 2,
  DEBUG: 3
};

// Default configuration
let config = {
  verbosity: VERBOSITY.NORMAL,
  useColors: true,
  jsonOutput: false,
  suppressConsole: false
};

// Store for captured output (always active)
let capturedOutput = {
  success: [],
  info: [],
  warning: [],
  error: [],
  debug: [],
  data: {},
  raw: []
};

// Store for command-specific captured output
let commandOutputs = {};

// Command context stack for nested commands
let commandContextStack = [];

/**
 * Configure the output manager
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.quiet - Set quiet mode (minimal output)
 * @param {boolean} options.verbose - Set verbose mode (more detailed output)
 * @param {boolean} options.debug - Set debug mode (maximum detail)
 * @param {boolean} options.noColor - Disable colored output
 * @param {boolean} options.json - Output in JSON format
 * @param {boolean} options.suppressConsole - Prevent output to console entirely
 * @param {string} options.commandName - Set the current command context
 */
function configure(options = {}) {
  if (options.quiet) config.verbosity = VERBOSITY.QUIET;
  if (options.verbose) config.verbosity = VERBOSITY.VERBOSE;
  if (options.debug) config.verbosity = VERBOSITY.DEBUG;
  if (options.noColor !== undefined) config.useColors = !options.noColor;
  if (options.json !== undefined) config.jsonOutput = options.json;
  if (options.suppressConsole !== undefined) config.suppressConsole = options.suppressConsole;
  
  // Legacy compatibility
  if (options.captureOutput !== undefined) {
    // If suppressConsole wasn't explicitly set, use !captureOutput
    if (options.suppressConsole === undefined) {
      config.suppressConsole = !options.captureOutput;
    }
  }
  
  // Set command context if provided
  if (options.commandName) {
    setCommandContext(options.commandName);
  }
}

/**
 * Format a success message
 * 
 * @param {string} message - The success message
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted success message
 */
function formatSuccessMsg(message, options = {}) {
  return config.useColors
    ? chalk.green(`✅ ${message}`)
    : `✅ ${message}`;
}

/**
 * Format an error message
 * 
 * @param {string} message - The error message
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted error message
 */
function formatErrorMsg(message, options = {}) {
  return config.useColors
    ? chalk.red(`❌ ${message}`)
    : `❌ ${message}`;
}

/**
 * Format a warning message
 * 
 * @param {string} message - The warning message
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted warning message
 */
function formatWarningMsg(message, options = {}) {
  return config.useColors
    ? chalk.yellow(`⚠️ ${message}`)
    : `⚠️ ${message}`;
}

/**
 * Format an info message
 * 
 * @param {string} message - The info message
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted info message
 */
function formatInfoMsg(message, options = {}) {
  return config.useColors
    ? chalk.blue(`ℹ️ ${message}`)
    : `ℹ️ ${message}`;
}

/**
 * Format a debug message
 * 
 * @param {string} message - The debug message
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted debug message
 */
function formatDebugMsg(message, options = {}) {
  return config.useColors
    ? chalk.gray(`🐞 ${message}`)
    : `🐞 ${message}`;
}

/**
 * Format a section header and content
 * 
 * @param {string} title - The section title
 * @param {string|string[]} content - The section content
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted section
 */
function formatSectionMsg(title, content, options = {}) {
  const header = config.useColors
    ? chalk.bold(`${title}:`)
    : `${title}:`;
  
  if (!content || (Array.isArray(content) && content.length === 0)) {
    // For empty sections, just add a newline after the header
    return `${header}\n`;
  }
  
  if (Array.isArray(content)) {
    return `${header}\n${content.map(item => `${item}`).join('\n')}\n`;
  }
  
  return `${header}\n${content}\n`;
}

/**
 * Output a success message to stdout
 * 
 * @param {string} message - The success message
 * @param {Object} options - Output options
 */
function success(message, options = {}) {
  // Always capture in global store
  capturedOutput.success.push(message);
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand]) {
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

/**
 * Output an info message to stdout
 * 
 * @param {string} message - The info message
 * @param {Object} options - Output options
 */
function info(message, options = {}) {
  // Always capture in global store
  capturedOutput.info.push(message);
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand]) {
    commandOutputs[currentCommand].info.push(message);
  }

  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'info', message }));
    } else {
      console.log(formatInfoMsg(message, options));
    }
  }
}

/**
 * Output a warning message to stderr
 * 
 * @param {string} message - The warning message
 * @param {Object} options - Output options
 */
function warn(message, options = {}) {
  // Always capture in global store
  capturedOutput.warning.push(message);
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand]) {
    commandOutputs[currentCommand].warning.push(message);
  }

  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.error(JSON.stringify({ type: 'warning', message }));
    } else {
      console.error(formatWarningMsg(message, options));
    }
  }
}

/**
 * Output an error message to stderr
 * 
 * @param {string} message - The error message
 * @param {string} errorType - The type of error
 * @param {Object} options - Output options
 */
function error(message, errorType = 'Error', options = {}) {
  // Always capture in global store
  capturedOutput.error.push({ message, type: errorType });
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand]) {
    commandOutputs[currentCommand].error.push({ message, type: errorType });
  }

  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.QUIET) {
    if (config.jsonOutput) {
      console.error(JSON.stringify({ type: 'error', errorType, message }));
    } else {
      console.error(formatErrorMsg(message, options));
    }
  }
}

/**
 * Output debug information to stderr
 * 
 * @param {string} message - The debug message
 * @param {Object} options - Output options
 */
function debug(message, options = {}) {
  // Always capture in global store
  capturedOutput.debug.push(message);
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand]) {
    commandOutputs[currentCommand].debug.push(message);
  }

  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.DEBUG) {
    if (config.jsonOutput) {
      console.error(JSON.stringify({ type: 'debug', message }));
    } else {
      console.error(formatDebugMsg(message, options));
    }
  }
}

/**
 * Output a section to stdout
 * 
 * @param {string} title - The section title
 * @param {string|string[]} content - The section content
 * @param {Object} options - Output options
 */
function section(title, content, options = {}) {
  // Always capture in global store
  if (!capturedOutput.data[title]) {
    capturedOutput.data[title] = [];
  }
  
  if (Array.isArray(content)) {
    capturedOutput.data[title] = capturedOutput.data[title].concat(content);
  } else {
    capturedOutput.data[title].push(content);
  }
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand]) {
    if (!commandOutputs[currentCommand].data[title]) {
      commandOutputs[currentCommand].data[title] = [];
    }
    
    if (Array.isArray(content)) {
      commandOutputs[currentCommand].data[title] = 
        commandOutputs[currentCommand].data[title].concat(content);
    } else {
      commandOutputs[currentCommand].data[title].push(content);
    }
  }

  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ 
        type: 'section', 
        title, 
        content: Array.isArray(content) ? content : content.split('\n')
      }));
    } else {
      console.log(formatSectionMsg(title, content, options));
    }
  }
}

/**
 * Output a list of items to stdout
 * 
 * @param {string[]} items - The items to list
 * @param {Object} options - Output options
 * @param {boolean} options.numbered - Whether to use numbered list
 */
function list(items, options = { numbered: false }) {
  // Always capture in global store
  if (items && items.length > 0) {
    capturedOutput.data.list = capturedOutput.data.list || [];
    capturedOutput.data.list = capturedOutput.data.list.concat(items);
  }
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand] && items && items.length > 0) {
    commandOutputs[currentCommand].data.list = commandOutputs[currentCommand].data.list || [];
    commandOutputs[currentCommand].data.list = 
      commandOutputs[currentCommand].data.list.concat(items);
  }

  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'list', items, options }));
    } else {
      if (!items || items.length === 0) {
        return;
      }
      
      const formattedList = items
        .map((item, index) => {
          if (options.numbered) {
            return `${index + 1}. ${item}`;
          }
          return `- ${item}`;
        })
        .join('\n');
      
      console.log(formattedList);
    }
  }
}

/**
 * Output a table to stdout
 * 
 * @param {Array<Array<string>>} data - The table data
 * @param {Object} options - Output options
 * @param {boolean} options.header - Whether the first row is a header
 */
function table(data, options = { header: false }) {
  // Always capture in global store
  if (data && data.length > 0) {
    capturedOutput.data.table = capturedOutput.data.table || [];
    capturedOutput.data.table.push({ data, options });
  }
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand] && data && data.length > 0) {
    commandOutputs[currentCommand].data.table = commandOutputs[currentCommand].data.table || [];
    commandOutputs[currentCommand].data.table.push({ data, options });
  }

  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'table', data, options }));
    } else {
      if (!data || data.length === 0) {
        return;
      }
      
      // Simple fixed width table
      // In a real implementation, calculate column widths dynamically
      data.forEach((row, index) => {
        const line = row.map(cell => cell.padEnd(20)).join(' ');
        if (options.header && index === 0 && config.useColors) {
          console.log(chalk.bold(line));
        } else {
          console.log(line);
        }
      });
    }
  }
}

/**
 * Output raw content directly to stdout
 * 
 * @param {string} content - The raw content to output
 */
function raw(content) {
  // Always capture in global store
  capturedOutput.raw.push(content);
  
  // Also capture in command-specific store if a command context is set
  const currentCommand = getCurrentCommand();
  if (currentCommand && commandOutputs[currentCommand]) {
    commandOutputs[currentCommand].raw.push(content);
  }

  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    console.log(content);
  }
}

/**
 * Print a blank line
 */
function blank() {
  // Only output to console if not suppressed
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL && !config.jsonOutput) {
    console.log('');
  }
}

/**
 * Print an empty line (alias for blank)
 */
function empty() {
  blank();
}

/**
 * Output a header
 * 
 * @param {string} text - The header text
 */
function header(text) {
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'header', text }));
    } else {
      const formattedText = config.useColors
        ? chalk.bold.underline(text)
        : text.toUpperCase();
      console.log(formattedText);
    }
  }
}

/**
 * Output a subheader
 * 
 * @param {string} text - The subheader text
 */
function subheader(text) {
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'subheader', text }));
    } else {
      const formattedText = config.useColors
        ? chalk.bold(text)
        : text;
      console.log(formattedText);
    }
  }
}

/**
 * Output a key-value pair
 * 
 * @param {string} key - The key
 * @param {string} value - The value
 */
function keyValue(key, value) {
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'keyValue', key, value }));
    } else {
      const formattedKey = config.useColors
        ? chalk.bold(key)
        : key;
      console.log(`${formattedKey} - ${value}`);
    }
  }
}

/**
 * Output a detail line (indented)
 * 
 * @param {string} text - The detail text
 */
function detail(text) {
  if (!config.suppressConsole && config.verbosity >= VERBOSITY.NORMAL) {
    if (config.jsonOutput) {
      console.log(JSON.stringify({ type: 'detail', text }));
    } else {
      console.log(`  ${text}`);
    }
  }
}

/**
 * Get the captured output
 * 
 * @returns {Object} The captured output data
 */
function getCapturedOutput() {
  // Return a deep copy to prevent mutation
  return JSON.parse(JSON.stringify(capturedOutput));
}

/**
 * Reset the output manager state and clear captured output
 */
function reset() {
  // Reset configuration to defaults
  config = {
    verbosity: VERBOSITY.NORMAL,
    useColors: true,
    jsonOutput: false,
    suppressConsole: false
  };
  
  // Clear captured output
  capturedOutput = {
    success: [],
    info: [],
    warning: [],
    error: [],
    debug: [],
    data: {},
    raw: []
  };
  
  // Reset command contexts
  commandOutputs = {};
  commandContextStack = [];
}

/**
 * Set the current command context
 * 
 * @param {string} commandName - The name of the command
 */
function setCommandContext(commandName) {
  // Clear the stack and set the new command
  commandContextStack = [commandName];
  
  // Initialize command output store if needed
  if (commandName && !commandOutputs[commandName]) {
    commandOutputs[commandName] = {
      success: [],
      info: [],
      warning: [],
      error: [],
      debug: [],
      data: {},
      raw: [],
      children: []
    };
  }
}

/**
 * Push a new command context onto the stack
 * 
 * @param {string} commandName - The name of the command
 */
function pushCommandContext(commandName) {
  // Add to the stack
  commandContextStack.push(commandName);
  
  // Initialize command output store if needed
  if (commandName && !commandOutputs[commandName]) {
    commandOutputs[commandName] = {
      success: [],
      info: [],
      warning: [],
      error: [],
      debug: [],
      data: {},
      raw: [],
      children: []
    };
  }
  
  // Add child reference to parent if there is one
  const parentCommand = getCurrentParentCommand();
  if (parentCommand && commandOutputs[parentCommand]) {
    // Only add if not already there
    const childExists = commandOutputs[parentCommand].children.some(
      child => child.name === commandName
    );
    
    if (!childExists) {
      commandOutputs[parentCommand].children.push({
        name: commandName,
        output: null // Will be populated later
      });
    }
  }
}

/**
 * Pop the current command context from the stack
 * 
 * @returns {string|null} The popped command name
 */
function popCommandContext() {
  if (commandContextStack.length <= 1) {
    return null; // Don't pop the last item
  }
  
  const poppedCommand = commandContextStack.pop();
  
  // Update parent's reference to this child's output
  const parentCommand = getCurrentCommand();
  if (parentCommand && poppedCommand) {
    const childIndex = commandOutputs[parentCommand].children.findIndex(
      child => child.name === poppedCommand
    );
    
    if (childIndex !== -1) {
      commandOutputs[parentCommand].children[childIndex].output = 
        JSON.parse(JSON.stringify(commandOutputs[poppedCommand]));
    }
  }
  
  return poppedCommand;
}

/**
 * Get the current command context
 * 
 * @returns {string|null} The current command name
 */
function getCurrentCommand() {
  return commandContextStack.length > 0 
    ? commandContextStack[commandContextStack.length - 1] 
    : null;
}

/**
 * Get the parent of the current command context
 * 
 * @returns {string|null} The parent command name
 */
function getCurrentParentCommand() {
  return commandContextStack.length > 1
    ? commandContextStack[commandContextStack.length - 2]
    : null;
}

/**
 * Get output for a specific command
 * 
 * @param {string} commandName - The name of the command
 * @returns {Object|null} The captured output for the command
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

/**
 * Convert captured output to a simple format
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
  
  // Handle error objects
  output.error.forEach(err => {
    const message = typeof err === 'object' ? err.message : err;
    const type = typeof err === 'object' ? err.type : 'Error';
    result.push({ type: 'error', message, errorType: type });
  });
  
  output.debug.forEach(msg => result.push({ type: 'debug', message: msg }));
  
  // Add section data
  Object.entries(output.data).forEach(([title, content]) => {
    if (title !== 'list' && title !== 'table') {
      result.push({ type: 'section', title, content });
    }
  });
  
  // Add lists
  if (output.data.list) {
    result.push({ type: 'list', items: output.data.list });
  }
  
  // Add tables
  if (output.data.table) {
    output.data.table.forEach(table => {
      result.push({ type: 'table', data: table.data, options: table.options });
    });
  }
  
  // Add raw output
  output.raw.forEach(content => result.push({ type: 'raw', content }));
  
  return result;
}

/**
 * Convert captured output to markdown
 * 
 * @param {Object} output - The captured output
 * @returns {string} Markdown representation
 */
function toMarkdown(output) {
  let result = '';
  
  // Add sections as headers
  Object.entries(output.data).forEach(([title, content]) => {
    if (title !== 'list' && title !== 'table') {
      result += `## ${title}\n\n`;
      if (Array.isArray(content)) {
        content.forEach(line => {
          result += `${line}\n`;
        });
      } else {
        result += `${content}\n`;
      }
      result += '\n';
    }
  });
  
  // Add success messages
  if (output.success.length > 0) {
    result += '## Success\n\n';
    output.success.forEach(msg => {
      result += `✅ ${msg}\n`;
    });
    result += '\n';
  }
  
  // Add info messages
  if (output.info.length > 0) {
    result += '## Info\n\n';
    output.info.forEach(msg => {
      result += `ℹ️ ${msg}\n`;
    });
    result += '\n';
  }
  
  // Add errors and warnings
  if (output.error.length > 0 || output.warning.length > 0) {
    result += '## Issues\n\n';
    output.error.forEach(err => {
      const message = typeof err === 'object' ? err.message : err;
      result += `❌ ${message}\n`;
    });
    output.warning.forEach(warn => {
      result += `⚠️ ${warn}\n`;
    });
    result += '\n';
  }
  
  // Add tables
  if (output.data.table && output.data.table.length > 0) {
    result += '## Tables\n\n';
    output.data.table.forEach(table => {
      if (table.data.length > 0) {
        // Create markdown table
        const headerRow = table.data[0];
        result += '| ' + headerRow.join(' | ') + ' |\n';
        result += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n';
        
        for (let i = 1; i < table.data.length; i++) {
          result += '| ' + table.data[i].join(' | ') + ' |\n';
        }
        result += '\n';
      }
    });
  }
  
  // Add lists
  if (output.data.list && output.data.list.length > 0) {
    result += '## List\n\n';
    output.data.list.forEach(item => {
      result += `- ${item}\n`;
    });
    result += '\n';
  }
  
  return result.trim();
}

/**
 * Transform captured output to the specified format
 * 
 * @param {Object} output - The captured output
 * @param {string} format - The desired output format ('simple', 'markdown')
 * @returns {Object|Array|string} The transformed output
 */
function transformOutput(output, format = 'default') {
  switch (format) {
    case 'simple':
      return toSimpleFormat(output);
    case 'markdown':
      return toMarkdown(output);
    default:
      return output;
  }
}

/**
 * Convert string to standard output format
 * 
 * @param {string} text - The text to format
 * @returns {string} - Formatted text
 */
function standardize(text) {
  // Ensure text ends with a newline but not multiple newlines
  return text.trim() + '\n';
}

module.exports = {
  // Configuration
  configure,
  VERBOSITY,
  
  // Output methods
  success,
  info,
  warn,
  error,
  debug,
  section,
  list,
  table,
  raw,
  blank,
  empty,
  header,
  subheader,
  keyValue,
  detail,
  
  // Output capture
  getCapturedOutput,
  reset,
  
  // Command context management
  setCommandContext,
  pushCommandContext,
  popCommandContext,
  getCurrentCommand,
  getCommandOutput,
  resetCommandOutput,
  
  // Output transformation
  toSimpleFormat,
  toMarkdown,
  transformOutput,
  
  // Formatting helpers
  formatSuccessMsg,
  formatErrorMsg,
  formatWarningMsg,
  formatInfoMsg,
  formatDebugMsg,
  formatSectionMsg,
  standardize,
};