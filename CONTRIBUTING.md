# Contributing to Issue Cards

Thank you for your interest in contributing to Issue Cards! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please be kind, respectful, and considerate of others.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (usually bundled with Node.js)
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/issue-cards.git
cd issue-cards
```

3. Install dependencies:

```bash
npm install
```

4. Link the package locally to test the command-line interface:

```bash
npm link
```

5. Initialize Issue Cards in a test directory:

```bash
mkdir test-project
cd test-project
issue-cards init
```

## Development Workflow

We use Issue Cards to manage the development of Issue Cards itself! After setting up the repo:

```bash
# In the issue-cards repository
issue-cards init
issue-cards list
```

### Working on a Feature

1. Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

2. Create an issue for your feature using Issue Cards:

```bash
issue-cards create feature --title "Your feature description"
```

3. Work through the tasks in the issue:

```bash
issue-cards current
# Work on the task
issue-cards complete-task
```

4. Run tests to make sure everything works:

```bash
npm test
```

5. Commit your changes with a descriptive message:

```bash
git commit -m "Implement feature: your feature description"
```

## Pull Request Process

1. Update your fork with the latest changes from the main repository:

```bash
git remote add upstream https://github.com/issue-cards/issue-cards.git
git fetch upstream
git merge upstream/main
```

2. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

3. Create a pull request from your fork to the main repository on GitHub.

4. In your pull request description, include:
   - A summary of the changes
   - Any related issue numbers
   - Screenshots if applicable
   - Testing instructions

5. The maintainers will review your PR, provide feedback, and merge it when ready.

## Coding Standards

We follow these coding standards:

- Use ES6+ JavaScript features
- Follow the existing code style (enforced by ESLint and Prettier)
- Use descriptive variable and function names
- Add JSDoc comments for all functions and classes
- Keep functions small and focused on a single responsibility
- Use async/await for asynchronous code

### Code Style

We use ESLint and Prettier to enforce code style. Run linting with:

```bash
npm run lint
```

Fix linting issues automatically with:

```bash
npm run lint:fix
```

Format code with Prettier:

```bash
npm run format
```

## Testing

We use Jest for testing. All new features should include tests. All tests should pass before submitting a PR.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

### Writing Tests

- Create tests in the `/tests` directory
- Follow the existing test structure
- Test both success and failure cases
- Mock external dependencies
- Aim for high code coverage

## Documentation

Good documentation is essential. Please update documentation when you make changes:

1. Add/update JSDoc comments for all functions and classes
2. Update relevant sections in the README.md
3. Update command examples and help text
4. Add to the docs directory for significant changes

## Issue Reporting

If you find a bug or have a feature request:

1. Check if the issue already exists in the GitHub issues
2. If not, create a new issue with:
   - A clear title
   - A detailed description
   - Steps to reproduce (for bugs)
   - Expected and actual behavior (for bugs)
   - Screenshots if applicable

For bugs, please include:
- Your operating system
- Node.js version (`node -v`)
- npm version (`npm -v`)
- Issue Cards version (`issue-cards --version`)

## Questions?

If you have any questions about contributing, please open an issue with your question.

Thank you for contributing to Issue Cards!