#!/usr/bin/env node

// ABOUTME: CLI script for validating AI documentation 
// ABOUTME: Ensures all documentation meets required structure and format

const fs = require('fs');
const path = require('path');
const { validateAllDocumentation, formatValidationResults } = require('../utils/documentationValidator');

// Configuration
const CONFIG = {
  outputFile: process.env.DOCS_VALIDATION_OUTPUT,
  failOnError: process.env.DOCS_VALIDATION_FAIL_ON_ERROR !== 'false',
  verbose: process.env.DOCS_VALIDATION_VERBOSE === 'true'
};

/**
 * Main validation function
 */
function validateDocs() {
  console.log('Validating AI documentation...');
  
  // Run validation
  const results = validateAllDocumentation();
  
  // Print summary
  console.log(`\nValidation Summary:`);
  console.log(`- Total issues: ${results.summary.total}`);
  console.log(`- Errors: ${results.summary.errors}`);
  console.log(`- Warnings: ${results.summary.warnings}`);
  
  // Print detailed results if verbose
  if (CONFIG.verbose) {
    for (const [category, issues] of Object.entries(results.categories)) {
      if (issues.length === 0) continue;
      
      console.log(`\n${category}:`);
      for (const issue of issues) {
        console.log(`- ${issue.toString()}`);
      }
    }
    
    if (results.crossReferences.length > 0) {
      console.log(`\nCross-References:`);
      for (const issue of results.crossReferences) {
        console.log(`- ${issue.toString()}`);
      }
    }
  }
  
  // Output to file if specified
  if (CONFIG.outputFile) {
    const formatted = formatValidationResults(results);
    fs.writeFileSync(CONFIG.outputFile, formatted);
    console.log(`\nDetailed results written to: ${CONFIG.outputFile}`);
  }
  
  // Exit with appropriate code
  if (results.summary.errors > 0 && CONFIG.failOnError) {
    console.error('\nValidation failed due to errors. Fix documentation issues and try again.');
    process.exit(1);
  } else {
    console.log('\nValidation complete.');
    process.exit(0);
  }
}

// Run validation
validateDocs();