/**
 * Example Node.js server that provides a webhook for Claude to interact with Issue Cards
 * 
 * This script creates a simple Express server that Claude can call to:
 * 1. Get information about issues and tasks
 * 2. Create and update issues
 * 3. Complete tasks
 * 
 * This enables Claude to work directly with your Issue Cards instance.
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');

// Configuration
const PORT = process.env.PORT || 3001;
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const API_TOKEN = process.env.MCP_API_TOKEN || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

// Create the Express app
const app = express();

// Middleware
app.use(bodyParser.json());

// Webhook authentication middleware
function authenticateWebhook(req, res, next) {
  const providedSecret = req.headers['x-webhook-secret'];
  
  if (!providedSecret || providedSecret !== WEBHOOK_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid webhook secret'
    });
  }
  
  next();
}

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
  
  return result; // Return the full result including success/error information
}

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint for Claude to call
app.post('/webhook', authenticateWebhook, async (req, res) => {
  const { action, params } = req.body;
  
  if (!action) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required parameter: action'
    });
  }
  
  try {
    // Map action to appropriate MCP tool
    let toolName = '';
    let args = {};
    
    switch (action) {
      case 'getCurrentTask':
        toolName = 'mcp__getCurrentTask';
        args = {};
        break;
        
      case 'listIssues':
        toolName = 'mcp__listIssues';
        args = { state: params?.state || 'open' };
        break;
        
      case 'showIssue':
        if (!params?.issueNumber) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameter: issueNumber'
          });
        }
        toolName = 'mcp__showIssue';
        args = { issueNumber: params.issueNumber };
        break;
        
      case 'completeTask':
        toolName = 'mcp__completeTask';
        args = {};
        break;
        
      case 'addNote':
        if (!params?.note || !params?.section) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameters: note and section'
          });
        }
        toolName = 'mcp__addNote';
        args = {
          note: params.note,
          section: params.section,
          issueNumber: params.issueNumber // Optional
        };
        break;
        
      case 'addQuestion':
        if (!params?.question) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameter: question'
          });
        }
        toolName = 'mcp__addQuestion';
        args = {
          question: params.question,
          issueNumber: params.issueNumber // Optional
        };
        break;
        
      case 'logFailure':
        if (!params?.approach) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameter: approach'
          });
        }
        toolName = 'mcp__logFailure';
        args = {
          approach: params.approach,
          reason: params.reason,
          issueNumber: params.issueNumber // Optional
        };
        break;
        
      case 'createIssue':
        if (!params?.title || !params?.template) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameters: title and template'
          });
        }
        toolName = 'mcp__createIssue';
        args = {
          title: params.title,
          template: params.template,
          problem: params.problem,
          approach: params.approach,
          task: params.tasks,
          instructions: params.instructions,
          questions: params.questions,
          failedApproaches: params.failedApproaches,
          nextSteps: params.nextSteps
        };
        break;
        
      case 'onboarding':
        toolName = 'mcp__onboarding';
        args = {
          role: params?.role || 'pm'
        };
        break;
        
      case 'workflow':
        toolName = 'mcp__workflow';
        args = {
          workflow: params?.workflow
        };
        break;
        
      case 'pm':
        toolName = 'mcp__pm';
        args = {};
        break;
      
      case 'dev':
        toolName = 'mcp__dev';
        args = {};
        break;
      
      case 'reviewer':
        toolName = 'mcp__reviewer';
        args = {};
        break;
        
      default:
        return res.status(400).json({
          error: 'Bad Request',
          message: `Unknown action: ${action}`
        });
    }
    
    // Call the appropriate MCP tool
    const result = await callMcpTool(toolName, args);
    
    // Return the result
    res.status(200).json(result);
    
  } catch (error) {
    console.error(`Error handling webhook:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Claude webhook server listening on port ${PORT}`);
  console.log(`Issue Cards MCP server URL: ${MCP_SERVER_URL}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
});

/**
 * Example Claude prompt to use with this webhook:
 * 
 * You can help me manage tasks in my issue tracking system. I have a webhook set up 
 * at http://localhost:3001/webhook that can interact with my Issue Cards instance.
 * 
 * You can perform the following actions:
 * 
 * 1. Get my current task: 
 *    Call the webhook with { "action": "getCurrentTask" }
 * 
 * 2. List all issues:
 *    Call the webhook with { "action": "listIssues", "params": { "state": "open" } }
 * 
 * 3. Show issue details:
 *    Call the webhook with { "action": "showIssue", "params": { "issueNumber": "0001" } }
 * 
 * 4. Complete the current task:
 *    Call the webhook with { "action": "completeTask" }
 * 
 * 5. Add a note:
 *    Call the webhook with { "action": "addNote", "params": { "section": "Planned approach", "note": "Your note" } }
 * 
 * 6. Add a question:
 *    Call the webhook with { "action": "addQuestion", "params": { "question": "Your question" } }
 * 
 * 7. Log a failed approach:
 *    Call the webhook with { "action": "logFailure", "params": { "approach": "Description", "reason": "Why it failed" } }
 * 
 * 8. Create a new issue:
 *    Call the webhook with { "action": "createIssue", "params": { "template": "feature", "title": "Issue title", "problem": "Description" } }
 * 
 * 9. Get onboarding guidance:
 *    Call the webhook with { "action": "onboarding", "params": { "role": "pm" } }
 *    Available roles: "pm" (project manager), "developer", "reviewer"
 * 
 * 10. Get workflow guidance:
 *     Call the webhook with { "action": "workflow", "params": { "workflow": "create-feature" } }
 *     For available workflows, call without the workflow parameter
 * 
 * You can just say "You're a project manager. Use issue-cards to help manage our project."
 * and I'll get onboarding guidance to help me understand how to use the system.
 * 
 * Please help me work on my current task by first getting its details.
 */