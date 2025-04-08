// ABOUTME: Documentation for the AI documentation validator tool
// ABOUTME: Explains how to use the validator to maintain documentation quality

# AI Documentation Validator

The documentation validator is a tool to ensure that all AI-specific documentation in the `docs/ai` directory follows the required structure and format. This helps maintain consistency and quality in the documentation used by the onboarding tools.

## Overview

The validator checks:

1. **Required Sections**: Ensures each documentation file contains all mandatory sections for its category
2. **Content Quality**: Verifies that sections have sufficient content
3. **Cross-References**: Validates that links between documentation files work
4. **File Existence**: Confirms that all expected documentation files exist

## Usage

### Command Line

Run the validator from the command line:

```bash
# Basic validation
npm run validate-docs

# Verbose output with all issues
DOCS_VALIDATION_VERBOSE=true npm run validate-docs

# Write detailed results to a file
DOCS_VALIDATION_OUTPUT=docs/validation-report.md npm run validate-docs

# Skip failing on errors 
DOCS_VALIDATION_FAIL_ON_ERROR=false npm run validate-docs
```

### Programmatic Use

You can also use the validator programmatically:

```javascript
const { 
  validateAllDocumentation, 
  formatValidationResults 
} = require('./src/utils/documentationValidator');

// Run validation
const results = validateAllDocumentation();

// Check results
console.log(`Found ${results.summary.errors} errors and ${results.summary.warnings} warnings`);

// Format as markdown
const formatted = formatValidationResults(results);
```

## Required Document Structure

### Role Documentation (`docs/ai/roles/*.md`)

Role documentation files must include:

1. `# Title`: Document title (h1)
2. `## Introduction`: Role overview
3. `## Recommended Workflows`: List of workflows with links
4. `## Best Practices`: List of best practices
5. `## Tool Usage Map`: Examples of common tools for this role

### Workflow Documentation (`docs/ai/workflows/*.md`)

Workflow documentation files must include:

1. `# Title`: Document title (h1)
2. `## Overview`: Workflow overview
3. `## Steps`: Numbered list of steps
4. `## Example Tool Sequence`: JSON code block with example tool sequence
5. `## Tips`: List of tips for the workflow

### Best Practices Documentation (`docs/ai/best-practices/*.md`)

Best practices documentation must include:

1. `# Title`: Document title (h1)
2. At least one content section

### Tool Examples Documentation (`docs/ai/tool-examples/*.md`)

Tool examples documentation must include:

1. `# Title`: Document title (h1)
2. At least one code block with example

## Integration with CI/CD

The validator can be integrated into CI/CD pipelines to ensure documentation quality. Add the following to your CI configuration:

```yaml
# Example GitHub Actions step
- name: Validate AI Documentation
  run: npm run validate-docs
```

## Extending the Validator

To add new validation rules:

1. Update `REQUIRED_SECTIONS` in `src/utils/documentationValidator.js`
2. Add custom validation logic in `validateDocumentationFile()`
3. Add tests in `tests/utils/documentationValidator.test.js`