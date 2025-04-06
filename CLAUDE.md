# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Test: `npm test` (all tests), `npm run test:unit` (unit tests), `npm run test:e2e` (e2e tests)
- Test single file: `npx jest path/to/file.test.js`
- Lint: `npm run lint`, Fix lint issues: `npm run lint:fix`
- Format: `npm run format`

## Code Style Guidelines
- Add "ABOUTME:" comments at top of each file (2 lines) explaining purpose
- Jsdoc for all functions with param/return types
- Error handling: Use custom error classes from utils/errors.js with displayMessage
- Naming: camelCase for variables/functions, PascalCase for classes
- Testing: Follow TDD principles - write tests before implementation
- Match existing patterns in similar files (imports, error handling, etc.)
- Exports at bottom of file, with comment indicating testing exports
- Tests must be pristine with no errors to pass