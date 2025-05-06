# Custom Installation Guide

This guide covers advanced installation options and configurations for issue-cards.

## Installation Options

### Standard Installation

The simplest way to install issue-cards:

```bash
# Install globally
npm install -g issue-cards

# Verify installation
issue-cards --version
```

### Project-Specific Installation

Install as a project dependency:

```bash
# Add to development dependencies
npm install --save-dev issue-cards

# Add scripts to package.json
"scripts": {
  "issue": "issue-cards",
  "init-issues": "issue-cards init",
  "list-issues": "issue-cards list",
  "current-task": "issue-cards current"
}

# Use via npm scripts
npm run issue -- create feature --title "New feature"
```

### Installing from Source

For development or customization:

```bash
# Clone the repository
git clone https://github.com/issue-cards/issue-cards.git
cd issue-cards

# Install dependencies
npm install

# Link for local development
npm link

# Now use issue-cards from anywhere
issue-cards --version
```

## Custom Directory Structure

### Using Environment Variables

Configure custom directories with environment variables:

```bash
# Set custom issues directory
export ISSUE_CARDS_DIR="/path/to/shared/issues"

# Initialize in custom location
issue-cards init
```

This is useful for:
- Sharing issues across multiple repositories
- Keeping issues separate from code
- Using a centralized issue repository

### Custom Configuration Per Project

Create a project-specific setup script:

```bash
#!/bin/bash
# setup-issues.sh

# Set custom directories
export ISSUE_CARDS_DIR="./project-issues"

# Initialize issue tracking
issue-cards init

# Create initial issue structure
issue-cards create feature --title "Project setup" \
  --task "Configure development environment" \
  --task "Setup testing framework" \
  --task "Create initial documentation"
```

Make it executable and run:

```bash
chmod +x setup-issues.sh
./setup-issues.sh
```

## Continuous Integration Setup

### Including in CI/CD Pipeline

Add issue-cards to your CI/CD workflow:

```yaml
# .github/workflows/issues.yml
name: Issue Management

on:
  push:
    branches: [ main ]
    paths:
      - 'issues/**'
  
jobs:
  validate-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install -g issue-cards
      - name: Validate issues
        run: |
          issue-cards list --json > issues.json
          # Add custom validation script here
```

### Automatic Issue Creation

Create issues automatically for specific events:

```bash
# Script to generate new issues from CI
if [[ "$CI_COMMIT_MESSAGE" =~ "feat:" ]]; then
  FEATURE_NAME=$(echo $CI_COMMIT_MESSAGE | sed 's/feat: //')
  
  issue-cards create feature --title "$FEATURE_NAME" \
    --task "Implement feature" \
    --task "Write tests" \
    --task "Update documentation"
fi
```

## Team Setup

### Shared Installation

For team environments:

1. Install globally on shared systems:
   ```bash
   # Require sudo/admin access
   sudo npm install -g issue-cards
   ```

2. Use a Docker container:
   ```dockerfile
   # Dockerfile
   FROM node:16-alpine
   RUN npm install -g issue-cards
   WORKDIR /issues
   VOLUME /issues
   ENTRYPOINT ["issue-cards"]
   ```

   Build and use:
   ```bash
   docker build -t issue-cards .
   docker run -v $(pwd):/issues issue-cards list
   ```

### Configuring for Multiple Users

Set up shared issue tracking with appropriate permissions:

```bash
# Create shared directory
mkdir -p /srv/project-issues
chmod 775 /srv/project-issues

# Configure for all team members
echo 'export ISSUE_CARDS_DIR="/srv/project-issues"' >> ~/.bashrc

# Initialize once
export ISSUE_CARDS_DIR="/srv/project-issues"
issue-cards init
```

## Advanced Configuration

### Combining with Other Tools

Integrate with task runners:

```javascript
// gulpfile.js
const { exec } = require('child_process');
const gulp = require('gulp');

gulp.task('create-issue', (done) => {
  exec('issue-cards create feature --title "New feature"', (err, stdout, stderr) => {
    console.log(stdout);
    done(err);
  });
});

gulp.task('list-issues', (done) => {
  exec('issue-cards list --json', (err, stdout, stderr) => {
    console.log(JSON.parse(stdout));
    done(err);
  });
});
```

### Custom Output Processing

Process issue-cards output programmatically:

```javascript
const { execSync } = require('child_process');

// Get issues as JSON
const issues = JSON.parse(
  execSync('issue-cards list --json', { encoding: 'utf8' })
);

// Process issues
const openIssues = issues.filter(issue => issue.status === 'open');
const tasksCount = openIssues.reduce(
  (sum, issue) => sum + issue.tasks.length, 0
);

console.log(`Open issues: ${openIssues.length}, Total tasks: ${tasksCount}`);
```

## Troubleshooting Installation

### Common Issues

1. **Command not found**
   ```bash
   # Check npm global path
   npm config get prefix
   
   # Ensure the path is in your PATH environment variable
   echo $PATH
   
   # Add to PATH if needed
   export PATH="$PATH:$(npm config get prefix)/bin"
   ```

2. **Permission issues**
   ```bash
   # Fix npm permissions
   sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
   
   # Or install with correct permissions
   npm install -g issue-cards --unsafe-perm=true
   ```

3. **Node.js version issues**
   ```bash
   # Check Node.js version
   node --version
   
   # Use nvm to install compatible version
   nvm install 16
   nvm use 16
   npm install -g issue-cards
   ```

## Related Topics

- [Getting Started Guide](getting-started.md) - Basic installation
- [Environment Variables Reference](../reference/environment-vars.md) - All configuration options
- [AI Integration Guide](ai-integration.md) - Setting up AI integration