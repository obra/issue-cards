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
  jsonOutput: false
};

/**
 * Configure the output manager
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.quiet - Set quiet mode (minimal output)
 * @param {boolean} options.verbose - Set verbose mode (more detailed output)
 * @param {boolean} options.debug - Set debug mode (maximum detail)
 * @param {boolean} options.noColor - Disable colored output
 * @param {boolean} options.json - Output in JSON format
 */
function configure(options = {}) {
  if (options.quiet) config.verbosity = VERBOSITY.QUIET;
  if (options.verbose) config.verbosity = VERBOSITY.VERBOSE;
  if (options.debug) config.verbosity = VERBOSITY.DEBUG;
  if (options.noColor !== undefined) config.useColors = !options.noColor;
  if (options.json !== undefined) config.jsonOutput = options.json;
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
  if (config.verbosity >= VERBOSITY.NORMAL) {
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
  if (config.verbosity >= VERBOSITY.NORMAL) {
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
  if (config.verbosity >= VERBOSITY.NORMAL) {
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
  if (config.verbosity >= VERBOSITY.QUIET) {
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
  if (config.verbosity >= VERBOSITY.DEBUG) {
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
  if (config.verbosity >= VERBOSITY.NORMAL) {
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
  if (config.verbosity >= VERBOSITY.NORMAL) {
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
  if (config.verbosity >= VERBOSITY.NORMAL) {
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
  if (config.verbosity >= VERBOSITY.NORMAL) {
    console.log(content);
  }
}

/**
 * Print a blank line
 */
function blank() {
  if (config.verbosity >= VERBOSITY.NORMAL && !config.jsonOutput) {
    console.log('');
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
  
  // Formatting helpers
  formatSuccessMsg,
  formatErrorMsg,
  formatWarningMsg,
  formatInfoMsg,
  formatDebugMsg,
  formatSectionMsg,
  standardize,
};