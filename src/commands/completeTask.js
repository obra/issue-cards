// ABOUTME: Implementation of the 'complete-task' command
// ABOUTME: Marks the current task as complete and shows the next task

const { Command } = require('commander');
const { spawnSync } = require('child_process');
const path = require('path');
const { isInitialized, getIssueDirectoryPath } = require('../utils/directory');
const { listIssues, saveIssue } = require('../utils/issueManager');
const { extractTasks, findCurrentTask, updateTaskStatus } = require('../utils/taskParser');
const { formatSuccess, formatError } = require('../utils/output');

// Importing the currentAction to show the next task
const { currentAction } = require('./current');

/**
 * Stage issue file changes in git
 * 
 * @param {string} issueNumber - Issue number
 * @returns {void}
 */
function stageChangesInGit(issueNumber) {
  try {
    // Get the path to the issue file
    const issueFilePath = path.join(getIssueDirectoryPath('open'), `issue-${issueNumber}.md`);
    
    // Run git add command
    const result = spawnSync('git', ['add', issueFilePath], { 
      stdio: 'ignore',
      timeout: 5000 // 5 second timeout
    });
    
    // git add command succeeded
    if (result.status === 0) {
      console.log(formatSuccess('Changes staged in git'));
    }
  } catch (error) {
    // Silently ignore git errors - git integration is optional
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
      console.error(formatError('Issue tracking is not initialized. Run `issue-cards init` first.'));
      return;
    }
    
    // Get open issues
    const issues = await listIssues();
    
    if (issues.length === 0) {
      console.error(formatError('No open issues found.'));
      return;
    }
    
    // Use the first issue as the current one
    const currentIssue = issues[0];
    
    // Extract tasks from the issue
    const tasks = await extractTasks(currentIssue.content);
    
    // Find the current (first uncompleted) task
    const currentTask = findCurrentTask(tasks);
    
    if (!currentTask) {
      console.error(formatError('No tasks found or all tasks are already completed.'));
      return;
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
    stageChangesInGit(currentIssue.number);
    
    // Show completion message
    console.log(formatSuccess(`Completed: ${currentTask.text}`));
    
    // Check if all tasks are now completed
    const updatedTasks = await extractTasks(updatedContent);
    const nextTask = findCurrentTask(updatedTasks);
    
    if (!nextTask) {
      console.log(formatSuccess('🎉 All tasks complete! Issue has been closed.'));
      console.log('');
      console.log('Would you like to work on another issue? Run:');
      console.log('  issue-cards list');
    } else {
      console.log('');
      console.log('NEXT TASK:');
      // Show the next task
      await currentAction();
    }
  } catch (error) {
    console.error(formatError(`Failed to complete task: ${error.message}`));
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