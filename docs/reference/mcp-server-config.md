# MCP Server Configuration

This document provides detailed information on configuring and running the Issue Cards MCP server for AI integration.

## Starting the Server

The MCP server is a built-in feature of Issue Cards that allows AI assistants to interact with your issues and tasks. You can start the server using the `serve` command:

```bash
issue-cards serve
```

By default, this starts a server on port 3000 and binds to localhost.

## Configuration Options

The `serve` command accepts several options to customize the server behavior:

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--port` | `-p` | Port to listen on | 3000 |
| `--host` | `-h` | Host to bind to | localhost |
| `--token` | `-t` | Authentication token | none (authentication disabled) |
| `--no-auth` | | Explicitly disable authentication | false |
| `--cors` | | Enable CORS for cross-origin requests | false |

### Examples

Start server on a different port:
```bash
issue-cards serve --port 8080
```

Bind to all network interfaces (use with caution):
```bash
issue-cards serve --host 0.0.0.0
```

Enable authentication with a token:
```bash
issue-cards serve --token your-secret-token
```

Enable CORS for cross-origin requests:
```bash
issue-cards serve --cors
```

## Authentication

By default, the server runs without authentication when no token is provided. This is suitable for local development but **not recommended for production environments**.

### Enabling Authentication

To enable authentication, provide a token when starting the server:

```bash
issue-cards serve --token your-secret-token
```

When authentication is enabled, clients must include the token in their requests using one of these methods:

1. As an Authorization header:
```
Authorization: Bearer your-secret-token
```

2. As a query parameter:
```
http://localhost:3000/api/tools/execute?token=your-secret-token
```

### Generating a Secure Token

For production use, generate a secure random token:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Environment Variables

The MCP server can also be configured using environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `ISSUE_CARDS_MCP_PORT` | Port to listen on | `8080` |
| `ISSUE_CARDS_MCP_HOST` | Host to bind to | `0.0.0.0` |
| `ISSUE_CARDS_MCP_TOKEN` | Authentication token | `your-secret-token` |
| `ISSUE_CARDS_MCP_AUTH` | Enable/disable authentication | `true` or `false` |
| `ISSUE_CARDS_MCP_CORS` | Enable/disable CORS | `true` or `false` |

Environment variables take precedence over command-line options.

Example using environment variables:

```bash
ISSUE_CARDS_MCP_PORT=8080 ISSUE_CARDS_MCP_TOKEN=your-secret-token issue-cards serve
```

## Server Endpoints

The MCP server exposes the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check, returns server status |
| `/api/status` | GET | More detailed server status and available tools |
| `/api/tools` | GET | List all available MCP tools |
| `/api/tools/:name` | GET | Get details for a specific tool |
| `/api/tools/execute` | POST | Execute an MCP tool |

For details on using these endpoints, see the [MCP Curl Examples](mcp-curl-examples.md) documentation.

## Security Considerations

When deploying the MCP server in a production environment, consider these security best practices:

1. **Always Enable Authentication**: Use a strong, randomly-generated token.

2. **Bind to Localhost**: Unless you need remote access, bind only to localhost.

3. **Use HTTPS**: For production deployments, place the server behind a reverse proxy with HTTPS.

4. **Firewall Rules**: Restrict access to the server port using firewall rules.

5. **Rate Limiting**: Consider implementing rate limiting at the network level.

## Running as a Service

For long-running deployments, you may want to run the MCP server as a system service.

### Example systemd Service (Linux)

Create a file at `/etc/systemd/system/issue-cards-mcp.service`:

```ini
[Unit]
Description=Issue Cards MCP Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/your/project
ExecStart=/usr/bin/npx issue-cards serve --port 3000 --token your-secret-token
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable issue-cards-mcp
sudo systemctl start issue-cards-mcp
```

### Using PM2 (Node.js Process Manager)

Alternatively, you can use PM2:

```bash
# Install PM2
npm install -g pm2

# Start the server with PM2
pm2 start "npx issue-cards serve --port 3000 --token your-secret-token" --name "issue-cards-mcp"

# Make it start on system boot
pm2 startup
pm2 save
```

## Troubleshooting

### Address Already in Use

If you see an error like "Address already in use", another process is using the port:

```bash
# Find what's using the port
lsof -i :3000

# Start the server on a different port
issue-cards serve --port 8080
```

### Authentication Issues

If you're getting authentication errors, verify:

1. The token is correct and matches what you provided at server startup
2. The token is properly formatted in the request header or query parameter

### CORS Issues

If you're getting CORS errors when accessing the API from a browser:

```bash
# Enable CORS
issue-cards serve --cors
```

## Resources

- [MCP Curl Examples](mcp-curl-examples.md) - Examples of using the API with curl
- [AI Integration](ai-integration.md) - General guide for AI integration
- [Claude Prompt Examples](claude-prompt-examples.md) - Example prompts for Claude
- [MCP Tool Reference](mcp-tool-reference.md) - Detailed reference for all MCP tools