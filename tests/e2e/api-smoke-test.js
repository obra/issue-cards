#!/usr/bin/env node
/**
 * Simple smoke test for the MCP API server
 * Run this script with Node.js to test the MCP API
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'test-token';

/**
 * Make an API request
 *
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {Object} [body] - Request body
 * @returns {Promise<Object>} - Response data
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(`${BASE_URL}${path}`, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (error) {
          console.error('Error parsing response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Run the smoke test
 */
async function runSmokeTest() {
  console.log('Starting MCP API smoke test...');

  try {
    // Health check
    console.log('\n1. Testing health check endpoint...');
    const healthResponse = await makeRequest('GET', '/api/health');
    console.log(`Status: ${healthResponse.statusCode}`);
    console.log('Response:', healthResponse.data);

    // Server status
    console.log('\n2. Testing server status endpoint...');
    const statusResponse = await makeRequest('GET', '/api/status');
    console.log(`Status: ${statusResponse.statusCode}`);
    console.log('Tools available:', statusResponse.data.tools.length);
    console.log('Available tools:', statusResponse.data.tools.map(t => t.name).join(', '));

    // List tools
    console.log('\n3. Testing tools listing endpoint...');
    const toolsResponse = await makeRequest('GET', '/api/tools');
    console.log(`Status: ${toolsResponse.statusCode}`);
    console.log('Tools count:', toolsResponse.data.count);

    // Execute listIssues tool
    console.log('\n4. Testing tool execution (listIssues)...');
    const listResponse = await makeRequest('POST', '/api/tools/execute', {
      tool: 'mcp__listIssues',
      args: { state: 'all' }
    });
    console.log(`Status: ${listResponse.statusCode}`);
    console.log('Success:', listResponse.data.success);
    if (listResponse.data.success) {
      console.log('Issues found:', listResponse.data.data.length);
    } else {
      console.log('Error:', listResponse.data.error);
    }

    console.log('\nSmoke test completed successfully!');
  } catch (error) {
    console.error('Smoke test failed:', error.message);
    process.exit(1);
  }
}

// Run the smoke test if this script is executed directly
if (require.main === module) {
  console.log('Make sure the MCP server is running (issue-cards serve --token test-token)');
  console.log('Press Ctrl+C to cancel or any key to continue...');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    runSmokeTest();
  });
}