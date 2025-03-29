# Issue Cards Integration Examples

This directory contains example scripts and integrations for using Issue Cards with other tools and AI assistants.

## Scripts Overview

- `task-workflow.js` - Example Node.js script demonstrating a complete task workflow
- `issue-creator.js` - Script for creating issues from JSON templates
- `status-reporter.js` - Generate status reports from open issues
- `claude-webhook.js` - Example webhook handler for Claude integration

## Requirements

These scripts require Node.js 14+ and the following packages:

```bash
npm install node-fetch dotenv express
```

## Environment Setup

Create a `.env` file with your configuration:

```
MCP_SERVER_URL=http://localhost:3000
MCP_API_TOKEN=your_token_here
```

## Running the Examples

Each script can be run directly with Node.js:

```bash
node task-workflow.js
```

Make sure the Issue Cards MCP server is running:

```bash
issue-cards serve --token your_token_here
```