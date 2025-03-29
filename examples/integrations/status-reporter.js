/**
 * Example Node.js script for generating status reports from open issues
 * 
 * This script generates a Markdown report of all open issues, their status,
 * and current tasks. Useful for team updates and progress tracking.
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const fs = require('fs').promises;
const path = require('path');

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const API_TOKEN = process.env.MCP_API_TOKEN || '';
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'status-report.md';

// API helper for making requests to the MCP server
async function callMcpTool(toolName, args = {}) {
  const url = `${MCP_SERVER_URL}/api/tools/execute`;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {})
    },
    body: JSON.stringify({
      tool: toolName,
      args
    })
  };
  
  const response = await fetch(url, options);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`${toolName} failed: ${result.error.message}`);
  }
  
  return result.data;
}

/**
 * Extract tasks from issue content
 * @param {string} content - Issue content
 * @returns {Object} Object with completed and total task counts
 */
function extractTaskStatus(content) {
  const taskLines = content.match(/- \[([ x])\] .+/g) || [];
  const completedTasks = taskLines.filter(line => line.includes('[x]')).length;
  const totalTasks = taskLines.length;
  
  return {
    completed: completedTasks,
    total: totalTasks,
    percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  };
}

/**
 * Generate a status report for all open issues
 */
async function generateStatusReport() {
  try {
    console.log('📊 Generating status report...');
    
    // Get all open issues
    const issues = await callMcpTool('mcp__listIssues', { state: 'open' });
    
    if (!issues || issues.length === 0) {
      console.log('✅ No open issues found');
      return;
    }
    
    console.log(`✅ Found ${issues.length} open issue(s)`);
    
    // Generate the report header
    const now = new Date();
    const reportDate = now.toISOString().split('T')[0];
    
    let report = `# Issue Cards Status Report\n\n`;
    report += `**Date:** ${reportDate}\n\n`;
    report += `**Total Open Issues:** ${issues.length}\n\n`;
    
    // Add a summary table
    report += `## Summary\n\n`;
    report += `| Issue | Title | Progress | Current Task |\n`;
    report += `|-------|-------|----------|-------------|\n`;
    
    // Process each issue
    for (const issue of issues) {
      const taskStatus = extractTaskStatus(issue.content);
      
      // Determine the current task
      const taskMatch = issue.content.match(/- \[ \] (.+?)(\n|$)/);
      const currentTask = taskMatch ? taskMatch[1] : 'No active tasks';
      
      // Add issue to the summary table
      report += `| #${issue.number} | ${issue.title} | ${taskStatus.completed}/${taskStatus.total} (${taskStatus.percentage}%) | ${currentTask} |\n`;
    }
    
    // Add detailed issue information
    report += `\n## Issue Details\n\n`;
    
    for (const issue of issues) {
      const taskStatus = extractTaskStatus(issue.content);
      
      report += `### #${issue.number}: ${issue.title}\n\n`;
      
      // Extract problem description (first 200 chars)
      const problemMatch = issue.content.match(/## Problem to be solved\n\n([^#]+)/);
      if (problemMatch) {
        const problem = problemMatch[1].trim();
        report += `**Problem:** ${problem.length > 200 ? problem.slice(0, 200) + '...' : problem}\n\n`;
      }
      
      // Extract progress information
      report += `**Progress:** ${taskStatus.completed}/${taskStatus.total} tasks completed (${taskStatus.percentage}%)\n\n`;
      
      // Extract tasks
      const taskLines = issue.content.match(/- \[([ x])\] (.+?)(\n|$)/g) || [];
      
      if (taskLines.length > 0) {
        report += `**Tasks:**\n\n`;
        for (const taskLine of taskLines) {
          const isCompleted = taskLine.includes('[x]');
          const taskText = taskLine.replace(/- \[([ x])\] /, '');
          report += `- [${isCompleted ? 'x' : ' '}] ${taskText}\n`;
        }
        report += '\n';
      }
    }
    
    // Write the report to a file
    await fs.writeFile(OUTPUT_FILE, report);
    
    console.log(`✅ Status report written to ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the report generator
generateStatusReport();