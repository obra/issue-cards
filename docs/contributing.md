# Contributing to Issue Cards

This guide covers essential information for project contributors and developers. See [CONTRIBUTING.md](../CONTRIBUTING.md) in the project root for the full contribution guide.

## Development Environment

### Project Structure

```
issue-cards/
├── src/               # Source code
│   ├── commands/      # Command implementations
│   ├── utils/         # Utility functions
│   ├── mcp/           # MCP server implementation
│   ├── cli.js         # Command-line interface entry
│   └── index.js       # Main entry point
├── tests/             # Test suite
│   ├── commands/      # Command tests
│   ├── utils/         # Utility tests
│   ├── e2e/           # End-to-end tests
│   └── integration/   # Integration tests
├── docs/              # Documentation
├── templates/         # Issue and tag templates
└── .issues/           # Issue tracking (when initialized)
```

## Testing Guide

### Testing Philosophy

Issue Cards follows a comprehensive testing approach with multiple layers:

1. **Unit Tests**: Testing individual functions and components in isolation
2. **Integration Tests**: Testing how components work together
3. **End-to-End (E2E) Tests**: Testing the CLI application as a whole

### Running Tests

```bash
# Run all tests
npm test

# Run tests with more detailed output
npm run test:verbose

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests (excludes E2E tests)
npm run test:unit

# Run only E2E tests
npm run test:e2e

# Run E2E tests with coverage collection
npm run test:e2e-coverage
```

### Code Coverage for E2E Tests

E2E tests execute the CLI as a separate process, which makes it challenging to collect coverage information. The project offers two approaches:

#### Standard Coverage with Jest

When running `npm run test:e2e-coverage`, Jest's standard coverage instrumentation is used.

#### NYC Coverage for Subprocesses

For more accurate E2E coverage, we've integrated NYC (Istanbul):

1. Run `npm run coverage:e2e-with-nyc` to execute E2E tests with NYC coverage
2. After tests complete, run `npm run coverage:report` to generate an HTML report
3. View the report in `./coverage/index.html`

### E2E Testing Best Practices

When writing E2E tests that execute CLI commands, use the `runQuietly` helper from `tests/e2e/e2eHelpers.js`:

```javascript
const { runQuietly } = require('./e2eHelpers');

// Run a command and capture its output
const result = runQuietly(`node ${binPath} create feature --title "Test"`, {
  cwd: testDir,
  env: { ...process.env }
});

// Check success/failure
expect(result.status).toBe(0);
expect(result.stdout).toContain('Created Issue');
expect(result.stderr).toBe('');
```

### Test Isolation

Each E2E test should:
1. Create a temporary directory for testing
2. Initialize issue tracking in that directory
3. Run tests in isolation from other tests
4. Clean up after itself

## MCP Server Architecture

The MCP (Model-Code-Prompt) server enables AI integration with two transport mechanisms:

### HTTP Server

The HTTP server is implemented in `src/mcp/mcpServer.js` and provides REST endpoints:

- `GET /api/health` - Health check endpoint
- `GET /api/status` - Server status and available tools
- `GET /api/tools` - List all MCP tools
- `GET /api/tools/:name` - Get details for a specific tool
- `POST /api/tools/execute` - Execute an MCP tool with arguments

The server supports:
- Authentication via token
- CORS configuration
- Customizable host/port binding

### Stdio Server

The stdio server is implemented in `src/mcp/stdioServer.js` and provides:

- JSON-RPC 2.0 over stdin/stdout
- Tool discovery and execution
- Logging control with debug mode
- Designed for direct pipe integration

### MCP Tool Registry

Both servers use the same tool registry:
- Tools are registered with `registerTool(name, description, handler, schema)`
- Each tool has a JSON schema for validation
- Tool handlers are async functions that process requests

## Documentation Conventions

When adding features, update:
1. Command help text using the `description` and `examples` fields
2. README.md for high-level changes
3. Relevant documentation files

Be concise and use concrete examples.

## Adding New Commands

To add a new command:

1. Create a new file in `src/commands/`
2. Export an object with:
   - `name`: Command name
   - `description`: Command description
   - `execute(args)`: Function that executes the command
   - `examples`: Array of usage examples
   - `builder(yargs)`: Function to define command options

3. Register the command in `src/cli.js`

Example:

```javascript
module.exports = {
  name: 'hello',
  description: 'Say hello',
  execute: async (args) => {
    console.log(`Hello, ${args.name}!`);
    return { success: true };
  },
  builder: (yargs) => {
    return yargs.option('name', {
      describe: 'Name to greet',
      type: 'string',
      default: 'World'
    });
  },
  examples: [
    '$ issue-cards hello',
    '$ issue-cards hello --name John'
  ]
};
```

## Working with Templates

Issue templates are stored in:
- `templates/issue/` - Issue templates (feature, bugfix, etc.)
- `templates/tag/` - Tag templates (unit-test, e2e-test, etc.)

When adding a new template:
1. Create a Markdown file in the appropriate directory
2. Use the existing format with sections
3. For tag templates, include `[ACTUAL TASK GOES HERE]` where the task should be inserted
4. Update the template list in `src/utils/template.js`
5. Add tests in `tests/utils/template.test.js`