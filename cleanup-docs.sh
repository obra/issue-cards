#!/bin/bash

# Cleanup script for simplifying documentation

# Directories to remove entirely
rm -rf docs/reference
rm -rf docs/design
rm -rf docs/ai/best-practices
rm -rf docs/ai/roles
rm -rf docs/ai/tool-examples
rm -rf docs/ai/workflows
rm -rf docs/tutorials

# Individual files to remove
rm -f docs/guides/custom-installation.md
rm -f docs/guides/testing.md
rm -f docs/guides/templates-customization.md
rm -f docs/ai/index.md
rm -f docs/guides/common-workflows.md

# Make the script executable
chmod +x cleanup-docs.sh

echo "Documentation cleanup complete. Removed redundant files and directories."
echo "Remaining structure:"
find docs -type f -name "*.md" | sort