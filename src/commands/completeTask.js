// ABOUTME: Implementation of the 'complete-task' command
// ABOUTME: Marks the current task as complete and shows the next task

const { Command } = require('commander');
const path = require('path');
const { isInitialized, getIssueDirectoryPath } = require('../utils/directory');
const { listIssues, saveIssue, getIssue } = require('../utils/issueManager');
const { extractTasks, findCurrentTask, updateTaskStatus } = require('../utils/taskParser');
// Output manager is used for all output formatting
const { isGitRepository, isGitAvailable } = require('../utils/gitDetection');
const { gitStage } = require('../utils/gitOperations');
const { expandTask } = require('../utils/taskExpander');
const output = require('../utils/outputManager');
const { UninitializedError, UserError } = require('../utils/errors');

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
      throw new UninitializedError();
    }
    
    // Get open issues
    const issues = await listIssues();
    
    if (issues.length === 0) {
      throw new UserError('No open issues found');
    }
    
    // Use the first issue as the current one
    const currentIssue = issues[0];
    
    // Extract tasks from the issue
    const tasks = await extractTasks(currentIssue.content);
    
    // Find the current (first uncompleted) task
    const currentTask = findCurrentTask(tasks);
    
    if (!currentTask) {
      throw new UserError('No tasks found or all tasks are already completed');
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
      output.success('🎉 All tasks complete! Issue has been closed.');
      output.blank();
      output.info('Would you like to work on another issue? Run:');
      output.info('  issue-cards list');
    } else {
      // Extract context from the issue
      const issueContent = await getIssue(currentIssue.number);
      const context = extractContext(issueContent);
      
      // Build output for next task
      output.blank();
      
      // Show next task with NEXT TASK header
      output.section('NEXT TASK', nextTask.text);
      
      // Show context as individual sections
      if (context.problem) {
        output.section('Problem to be solved', context.problem);
      }
      
      if (context.approach) {
        output.section('Planned approach', context.approach);
      }
      
      if (context.failed && context.failed.length > 0) {
        output.section('Failed approaches', context.failed);
      }
      
      if (context.questions && context.questions.length > 0) {
        output.section('Questions to resolve', context.questions);
      }
      
      if (context.instructions) {
        output.section('Instructions', context.instructions);
      }
      
      // Show expanded task for the next task if it has tags
      const expandedSteps = await expandTask(nextTask);
      if (expandedSteps.length > 0) {
        output.section('EXPANDED TASK', expandedSteps.map((step, i) => `${i + 1}. ${step}`));
      }
    }
  } catch (error) {
    if (error instanceof UninitializedError || error instanceof UserError) {
      output.error(`${error.message}${error.recoveryHint ? ` (${error.recoveryHint})` : ''}`);
    } else {
      output.error(`Failed to complete task: ${error.message}`);
    }
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