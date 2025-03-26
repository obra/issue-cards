// ABOUTME: Custom error classes for Issue Cards
// ABOUTME: Provides standardized error handling and exit codes

/**
 * Base error class for Issue Cards
 */
class IssueCardsError extends Error {
  /**
   * Create a new IssueCardsError
   * 
   * @param {string} message - Error message
   * @param {number} code - Exit code to use
   */
  constructor(message, code = 1) {
    super(message);
    this.name = 'IssueCardsError';
    this.code = code;
    this.recoveryHint = '';
    this.displayMessage = null; // New property to store formatted message
    this.displayed = false;     // Flag to track if error was already displayed
  }

  /**
   * Add a recovery hint to the error
   * 
   * @param {string} hint - Recovery hint text
   * @returns {IssueCardsError} The error instance for chaining
   */
  withRecoveryHint(hint) {
    this.recoveryHint = hint;
    return this;
  }
  
  /**
   * Add a formatted display message to the error
   * 
   * @param {string} message - Formatted message for display
   * @returns {IssueCardsError} The error instance for chaining
   */
  withDisplayMessage(message) {
    this.displayMessage = message;
    return this;
  }
  
  /**
   * Mark the error as having been displayed to avoid duplicates
   * 
   * @returns {IssueCardsError} The error instance for chaining
   */
  markDisplayed() {
    this.displayed = true;
    return this;
  }
}

/**
 * Error for invalid user input
 */
class UserError extends IssueCardsError {
  /**
   * Create a new UserError
   * 
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message, 2);
    this.name = 'UserError';
  }
}

/**
 * Error for system-level issues
 */
class SystemError extends IssueCardsError {
  /**
   * Create a new SystemError
   * 
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message, 3);
    this.name = 'SystemError';
  }
}

/**
 * Error for unexpected internal errors
 */
class InternalError extends IssueCardsError {
  /**
   * Create a new InternalError
   * 
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message, 4);
    this.name = 'InternalError';
  }
}

/**
 * Error for missing initialization
 */
class UninitializedError extends UserError {
  /**
   * Create a new UninitializedError
   */
  constructor() {
    super('Issue tracking is not initialized');
    this.name = 'UninitializedError';
    this.withRecoveryHint('Run `issue-cards init` first');
  }
}

/**
 * Error for missing issue
 */
class IssueNotFoundError extends UserError {
  /**
   * Create a new IssueNotFoundError
   * 
   * @param {string|number} issueNumber - The issue number that was not found
   */
  constructor(issueNumber) {
    super(`Issue #${issueNumber} not found`);
    this.name = 'IssueNotFoundError';
  }
}

/**
 * Error for missing templates
 */
class TemplateNotFoundError extends UserError {
  /**
   * Create a new TemplateNotFoundError
   * 
   * @param {string} templateName - The template name that was not found
   */
  constructor(templateName) {
    super(`Template not found: ${templateName}`);
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Error for missing sections
 */
class SectionNotFoundError extends UserError {
  /**
   * Create a new SectionNotFoundError
   * 
   * @param {string} sectionName - The section name that was not found
   */
  constructor(sectionName) {
    super(`Section "${sectionName}" not found in issue`);
    this.name = 'SectionNotFoundError';
  }
}

module.exports = {
  IssueCardsError,
  UserError,
  SystemError,
  InternalError,
  UninitializedError,
  IssueNotFoundError,
  TemplateNotFoundError,
  SectionNotFoundError,
};