#!/usr/bin/env node

/**
 * Post-install script to ensure the CLI binary is executable
 */
const fs = require('fs');
const path = require('path');

// The binary path
const binPath = path.join(__dirname, '..', 'bin', 'issue-cards.js');

try {
  // Only run on non-Windows platforms that support chmod
  if (process.platform !== 'win32') {
    // Make the file executable (add +x permission)
    fs.chmodSync(binPath, '755');
    console.log('Made issue-cards binary executable');
  }
} catch (error) {
  // Just log errors but don't fail the installation
  console.error('Warning: Could not make issue-cards binary executable', error.message);
}