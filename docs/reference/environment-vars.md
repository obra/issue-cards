# Issue Cards Environment Variables

This document provides a comprehensive reference for all environment variables supported by Issue Cards. Environment variables allow you to configure the application's behavior without modifying code or command-line arguments.

## Core Configuration

### ISSUE_CARDS_DIR

**Purpose**: Sets the directory where Issue Cards stores issues, templates, and configuration.  
**Default**: `.issues` in the current working directory  
**Format**: Absolute or relative path  
**Example**: `/home/user/projects/myapp/.issues`

```bash
# Use a custom directory for issues
export ISSUE_CARDS_DIR=/path/to/custom/issues
issue-cards init
```

This is useful for:
- Storing issues in a shared location across multiple repositories
- Keeping issues separate from the main codebase
- Running Issue Cards in continuous integration environments

## MCP Server Configuration

The MCP (Model-Code-Prompt) server supports several environment variables for configuration. These can be used instead of or in addition to command-line options.

### ISSUE_CARDS_MCP_PORT

**Purpose**: Sets the port for the MCP server  
**Default**: `3000`  
**Format**: Integer  
**Example**: `8080`

```bash
# Start the server on port 8080
ISSUE_CARDS_MCP_PORT=8080 issue-cards serve
```

### ISSUE_CARDS_MCP_HOST

**Purpose**: Sets the host to bind the MCP server to  
**Default**: `localhost`  
**Format**: String  
**Example**: `0.0.0.0`

```bash
# Bind to all interfaces (use with caution)
ISSUE_CARDS_MCP_HOST=0.0.0.0 issue-cards serve
```

### ISSUE_CARDS_MCP_TOKEN

**Purpose**: Sets the authentication token for the MCP server  
**Default**: None (authentication disabled)  
**Format**: String  
**Example**: `my-secret-token`

```bash
# Enable authentication with a token
ISSUE_CARDS_MCP_TOKEN=my-secret-token issue-cards serve
```

### ISSUE_CARDS_MCP_CORS

**Purpose**: Enables or disables CORS (Cross-Origin Resource Sharing) for the MCP server  
**Default**: `false`  
**Format**: Boolean (`true` or `false`)  
**Example**: `true`

```bash
# Enable CORS for cross-origin requests
ISSUE_CARDS_MCP_CORS=true issue-cards serve
```

## Testing Configuration

These environment variables are primarily used during development and testing.

### NODE_ENV

**Purpose**: Sets the application environment  
**Default**: Not set  
**Format**: String  
**Values**: `development`, `production`, `test`  
**Example**: `test`

```bash
# Run in test mode
NODE_ENV=test issue-cards list
```

In test mode, certain behaviors are modified:
- File system errors are thrown instead of handled gracefully
- Temporary directories are created and cleaned up automatically
- Some error messages include more detailed information

### E2E_COLLECT_COVERAGE

**Purpose**: Enables code coverage collection during end-to-end tests  
**Default**: `false`  
**Format**: Boolean (`true` or `false`)  
**Example**: `true`

```bash
# Enable code coverage for E2E tests
E2E_COLLECT_COVERAGE=true npm run test:e2e
```

## Combined Example

Here's an example using multiple environment variables together:

```bash
# Use a custom issues directory, run the MCP server with authentication on port 8080
export ISSUE_CARDS_DIR=/data/issues
ISSUE_CARDS_MCP_PORT=8080 ISSUE_CARDS_MCP_TOKEN=secure-token issue-cards serve
```

## Best Practices

1. **Security**: Never store sensitive information like tokens in environment variables on shared systems.

2. **Persistence**: For persistent configuration, consider:
   - Adding environment variables to your shell profile (e.g., `.bashrc` or `.zshrc`)
   - Using a `.env` file with a tool like `dotenv` for local development
   - Setting environment variables in your CI/CD platform for automation

3. **Documentation**: If you use custom environment variables in your workflow, document them for team members in a project-specific README.

4. **Precedence**: Command-line options generally take precedence over environment variables. For example, `--port` will override `ISSUE_CARDS_MCP_PORT`.

## Environment Variable Scope

Environment variables are process-scoped. This means:
- They affect only the current process and its children
- They don't persist between terminal sessions unless added to your shell profile
- They don't affect other users on the system

## Troubleshooting

If environment variables don't seem to be working:

1. Verify the variable is set:
   ```bash
   echo $ISSUE_CARDS_DIR
   ```

2. Ensure proper capitalization and spelling (environment variables are case-sensitive)

3. Try setting the variable immediately before the command:
   ```bash
   ISSUE_CARDS_DIR=/path/to/issues issue-cards list
   ```

4. Check for conflicting command-line options that might be taking precedence