// ABOUTME: Implementation of the 'complete-task' command
// ABOUTME: Marks the current task as complete and shows the next task

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { isInitialized, getIssueDirectoryPath } = require('../utils/directory');
const { listIssues, saveIssue, getIssue, closeIssue, getCurrentIssue } = require('../utils/issueManager');
const { extractTasks, findCurrentTask, updateTaskStatus } = require('../utils/taskParser');
// Output manager is used for all output formatting
const { isGitRepository, isGitAvailable } = require('../utils/gitDetection');
const { gitStage } = require('../utils/gitOperations');
const { expandTask } = require('../utils/taskExpander');
const { displayTaskWithContext } = require('../utils/taskDisplay');
const output = require('../utils/outputManager');
const { UninitializedError, UserError, SystemError } = require('../utils/errors');

// Importing the extractContext function
const { extractContext } = require('./current');

/**
 * Stage issue file changes in git
 * 
 * @param {string} issueNumber - Issue number
 * @returns {Promise<void>}
 */
async function stageChangesInGit(issueNumber) {
  try {
    // Check if git is available and we're in a git repo
    if (!isGitAvailable() || !(await isGitRepository())) {
      return; // Git not available or not in a repo, silently skip
    }
    
    // Get the path to the issue file
    const issueFilePath = path.join(getIssueDirectoryPath('open'), `issue-${issueNumber}.md`);
    
    // Stage the file
    await gitStage(issueFilePath);
    output.success('Changes staged in git');
  } catch (error) {
    // Silently ignore git errors - git integration is optional
    // But log the error in debug mode
    output.debug(`Git operation skipped: ${error.message}`);
  }
}

/**
 * Action handler for the complete-task command
 */
async function completeTaskAction() {
  try {
    // Check if issue tracking is initialized
    const initialized = await isInitialized();
    
    if (!initialized) {
      throw new UninitializedError()
        .withDisplayMessage('Issue tracking is not initialized (Run `issue-cards init` first)');
    }
    
    // Get open issues
    const issues = await listIssues();
    
    if (issues.length === 0) {
      throw new UserError('No open issues found')
        .withDisplayMessage('No open issues found');
    }
    
    // Get the current issue
    const currentIssue = await getCurrentIssue();
    
    // Extract tasks from the issue
    const tasks = await extractTasks(currentIssue.content);
    
    // Find the current (first uncompleted) task
    const currentTask = findCurrentTask(tasks);
    
    if (!currentTask) {
      throw new UserError('No tasks found or all tasks are already completed')
        .withDisplayMessage('No tasks found or all tasks are already completed');
    }
    
    // Update the task status
    const updatedContent = await updateTaskStatus(
      currentIssue.content, 
      currentTask.index, 
      true
    );
    
    // Save the updated issue
    await saveIssue(currentIssue.number, updatedContent);
    
    // Try to stage changes in git
    await stageChangesInGit(currentIssue.number);
    
    // Show completion message
    output.success(`Task completed: ${currentTask.text}`);
    
    // Check if all tasks are now completed
    const updatedTasks = await extractTasks(updatedContent);
    const nextTask = findCurrentTask(updatedTasks);
    
    if (!nextTask) {
      // Close the issue by moving it to the closed directory
      await closeIssue(currentIssue.number);
      
      // Try to stage the closed issue file in git too
      try {
        if (isGitAvailable() && await isGitRepository()) {
          const closedIssuePath = path.join(getIssueDirectoryPath('closed'), `issue-${currentIssue.number}.md`);
          await gitStage(closedIssuePath);
        }
      } catch (error) {
        // Silently ignore git errors - git integration is optional
        output.debug(`Git staging for closed issue skipped: ${error.message}`);
      }
      
      // Clear .current file if this issue was the current one
      try {
        const currentFilePath = path.join(getIssueDirectoryPath(), '.current');
        const fileExists = await fs.promises.access(currentFilePath, fs.constants.F_OK)
          .then(() => true)
          .catch(() => false);
          
        if (fileExists) {
          const currentIssueNumber = await fs.promises.readFile(currentFilePath, 'utf8');
          // If this was the current issue, clear the .current file
          if (currentIssueNumber.trim() === currentIssue.number) {
            await fs.promises.unlink(currentFilePath);
          }
        }
      } catch (error) {
        // Silently ignore errors - this is just cleanup
        output.debug(`Failed to clear .current file: ${error.message}`);
      }
      
      output.success(`🎉 All tasks complete! Issue #${currentIssue.number} has been closed.`);
      output.blank();
      output.info('Would you like to work on another issue? Run:');
      output.info('  issue-cards list');
    } else {
      // Extract context from the issue
      const issueContent = await getIssue(currentIssue.number);
      const context = extractContext(issueContent);
      
      // Build output for next task
      output.blank();
      
      // Get expanded steps for the next task if it has tags
      const expandedSteps = await expandTask(nextTask);
      
      // Display the next task with context using the shared utility
      displayTaskWithContext(nextTask, context, expandedSteps, { headerPrefix: 'NEXT' });
    }
  } catch (error) {
    if (error instanceof UninitializedError || error instanceof UserError) {
      // Add formatted display message if not already set
      if (!error.displayMessage) {
        error.withDisplayMessage(`${error.message}${error.recoveryHint ? ` (${error.recoveryHint})` : ''}`);
      }
    } else {
      // Wrap non-IssueCardsError errors
      const errorMsg = `Failed to complete task: ${error.message}`;
      error = new SystemError(errorMsg).withDisplayMessage(errorMsg);
    }
    throw error;
  }
}

/**
 * Create the complete-task command
 * 
 * @returns {Command} The configured command
 */
function createCommand() {
  return new Command('complete-task')
    .description('Mark current task as complete and show next task')
    .action(completeTaskAction);
}

module.exports = {
  createCommand,
  completeTaskAction, // Exported for testing
};