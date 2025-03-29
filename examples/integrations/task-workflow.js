/**
 * Example Node.js script demonstrating a complete task workflow with Issue Cards MCP API
 * 
 * This script:
 * 1. Gets the current task from Issue Cards
 * 2. Documents an approach for implementing the task
 * 3. Completes the task and shows the next one
 */

// Load environment variables
require('dotenv').config();

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
 * Main workflow function
 */
async function runWorkflow() {
  try {
    console.log('📋 Starting task workflow...');
    
    // Step 1: Get current task
    console.log('\n🔍 Getting current task...');
    const currentTask = await callMcpTool('mcp__getCurrentTask');
    
    if (!currentTask) {
      console.log('❌ No current task found. Please set a current issue first.');
      return;
    }
    
    console.log(`\n✅ Current task retrieved:`);
    console.log(`Issue: #${currentTask.issueNumber} - ${currentTask.issueTitle}`);
    console.log(`Task: ${currentTask.description}`);
    
    if (currentTask.context) {
      console.log('\n📝 Task context:');
      
      if (currentTask.context.problem) {
        console.log(`Problem: ${currentTask.context.problem}`);
      }
      
      if (currentTask.context.approach) {
        console.log(`Approach: ${currentTask.context.approach}`);
      }
      
      if (currentTask.context.instructions) {
        console.log(`Instructions: ${currentTask.context.instructions}`);
      }
    }
    
    // Step 2: Simulate implementing the task
    console.log('\n🛠️ Implementing the task...');
    console.log('(This is where your actual implementation code would go)');
    
    // Add a note about our implementation approach
    console.log('\n📝 Documenting our implementation approach...');
    const implementationNote = `Implemented ${currentTask.description} using best practices. 
The solution focuses on maintainability and follows the project's coding standards.`;
    
    await callMcpTool('mcp__addNote', {
      section: 'Planned approach',
      note: implementationNote
    });
    
    console.log('✅ Implementation approach documented');
    
    // Step 3: Complete the task
    console.log('\n🏁 Completing the task...');
    const completionResult = await callMcpTool('mcp__completeTask');
    
    console.log(`✅ Task completed: ${completionResult.taskCompleted}`);
    
    // Check if there's a next task
    if (completionResult.nextTask) {
      console.log(`\n⏭️ Next task: ${completionResult.nextTask.description}`);
      
      if (completionResult.context) {
        console.log('\n📝 Next task context:');
        Object.entries(completionResult.context).forEach(([key, value]) => {
          console.log(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
        });
      }
    } else {
      console.log('\n🎉 All tasks complete! Issue has been closed.');
    }
    
    console.log('\n✅ Workflow completed successfully');
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the workflow
runWorkflow();