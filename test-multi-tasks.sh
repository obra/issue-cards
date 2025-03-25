#!/bin/bash
# Test script to verify that multiple tasks are correctly added on separate lines

# Set -e to exit on error
set -e

# Get path to the issue-cards binary
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARY_PATH="$SCRIPT_DIR/bin/issue-cards.js"

# Create temporary test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
echo "Created test directory: $TEST_DIR"

# Initialize issue tracking
echo "Initializing issue tracking..."
node "$BINARY_PATH" init

# Create an issue with multiple tasks
echo "Creating issue with multiple tasks..."
node "$BINARY_PATH" create feature --title "Test multiple tasks" --tasks "Task 1
Task 2
Task 3
Task with #unit-test tag
Another task with #e2e-test tag"

# Show the created issue to verify task formatting
echo "Showing created issue to verify task formatting..."
node "$BINARY_PATH" show 1

# Examine the raw markdown file directly
echo "Examining raw markdown file..."
cat .issues/open/issue-0001.md

echo
echo "Verification complete!"
echo "You can examine the test directory at: $TEST_DIR"
echo "When finished, you can remove it with: rm -rf $TEST_DIR"