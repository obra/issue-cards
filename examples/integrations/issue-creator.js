/**
 * Example Node.js script for creating issues from JSON templates
 * 
 * This script reads issue definitions from a JSON file and creates
 * them using the Issue Cards MCP API.
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const fs = require('fs').promises;
const path = require('path');

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const API_TOKEN = process.env.MCP_API_TOKEN || '';

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
 * Create issues from a JSON file
 * @param {string} filePath - Path to the JSON file with issue definitions
 */
async function createIssuesFromFile(filePath) {
  try {
    console.log(`📋 Reading issues from ${filePath}...`);
    
    // Read and parse the JSON file
    const fileContent = await fs.readFile(filePath, 'utf8');
    const issueDefinitions = JSON.parse(fileContent);
    
    console.log(`✅ Found ${issueDefinitions.length} issue(s) to create`);
    
    // Create each issue
    for (const [index, issueDef] of issueDefinitions.entries()) {
      console.log(`\n📝 Creating issue ${index + 1}/${issueDefinitions.length}: ${issueDef.title}`);
      
      // Validate required fields
      if (!issueDef.title || !issueDef.template) {
        console.error(`❌ Issue ${index + 1} is missing required fields (title or template)`);
        continue;
      }
      
      try {
        // Create the issue using the MCP API
        const result = await callMcpTool('mcp__createIssue', {
          template: issueDef.template,
          title: issueDef.title,
          problem: issueDef.problem || '',
          approach: issueDef.approach || '',
          task: issueDef.tasks || [],
          instructions: issueDef.instructions || '',
          questions: issueDef.questions?.join('\n') || '',
          failedApproaches: issueDef.failedApproaches?.join('\n') || '',
          nextSteps: issueDef.nextSteps?.join('\n') || ''
        });
        
        console.log(`✅ Created issue #${result.number}: ${result.title}`);
      } catch (error) {
        console.error(`❌ Failed to create issue "${issueDef.title}": ${error.message}`);
      }
    }
    
    console.log('\n✅ Finished creating issues');
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Check if a file path was provided
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Please provide a path to a JSON file with issue definitions');
  console.log('Example: node issue-creator.js ./issues.json');
  process.exit(1);
}

// Run the script
createIssuesFromFile(filePath);

/**
 * Example JSON file format:
 * 
 * [
 *   {
 *     "template": "feature",
 *     "title": "Add user authentication",
 *     "problem": "Users need to securely log in to access their content",
 *     "approach": "Implement JWT authentication with secure cookies",
 *     "tasks": [
 *       "Create User model",
 *       "Implement password hashing",
 *       "Create login endpoint"
 *     ],
 *     "questions": [
 *       "What should be the token expiration time?",
 *       "Should we support refresh tokens?"
 *     ],
 *     "instructions": "Follow OWASP security guidelines",
 *     "failedApproaches": [
 *       "Tried using localStorage but it was vulnerable to XSS"
 *     ],
 *     "nextSteps": [
 *       "Implement authorization middleware",
 *       "Add user profile management"
 *     ]
 *   }
 * ]
 */