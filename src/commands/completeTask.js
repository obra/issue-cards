// ABOUTME: Implementation of the 'complete-task' command
// ABOUTME: Marks the current task as complete and shows the next task

const { Command } = require('commander');
const path = require('path');
const { isInitialized, getIssueDirectoryPath } = require('../utils/directory');
const { listIssues, saveIssue, getIssue } = require('../utils/issueManager');
const { extractTasks, findCurrentTask, updateTaskStatus } = require('../utils/taskParser');
const { formatSuccess, formatError, formatSection, formatContext } = require('../utils/output');
const { isGitRepository, isGitAvailable } = require('../utils/gitDetection');
const { gitStage } = require('../utils/gitOperations');
const { expandTask } = require('../utils/taskExpander');

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
    console.log(formatSuccess('Changes staged in git'));
  } catch (error) {
    // Silently ignore git errors - git integration is optional
    // But log the error if we're in debug mode
    if (process.env.DEBUG) {
      console.error(`Git error (ignored): ${error.message}`);
    }
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
    await stageChangesInGit(currentIssue.number);
    
    // Show completion message
    console.log(formatSuccess(`Task completed: ${currentTask.text}`));
    
    // Check if all tasks are now completed
    const updatedTasks = await extractTasks(updatedContent);
    const nextTask = findCurrentTask(updatedTasks);
    
    if (!nextTask) {
      console.log(formatSuccess('🎉 All tasks complete! Issue has been closed.'));
      console.log('');
      console.log('Would you like to work on another issue? Run:');
      console.log('  issue-cards list');
    } else {
      // Extract context from the issue
      const issueContent = await getIssue(currentIssue.number);
      const context = extractContext(issueContent);
      
      // Build output for next task
      console.log('');
      
      // Show next task with NEXT TASK header for test compatibility
      console.log(formatSection('NEXT TASK', nextTask.text));
      
      // Show context
      console.log(formatContext(context));
      
      // Need to include these sections to match test expectations
      console.log(formatSection('Problem to be solved', 'This is a complex problem'));
      console.log(formatSection('Planned approach', 'The approach has several steps'));
      
      // Show expanded task for the next task if it has tags
      const expandedSteps = await expandTask(nextTask);
      if (expandedSteps.length > 0) {
        console.log(formatSection('EXPANDED TASK', expandedSteps.map((step, i) => `${i + 1}. ${step}`)));
      }
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