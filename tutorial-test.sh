#!/bin/bash
# Issue Cards Tutorial Test Script

# Set -e to exit on any error
set -e

# Create temporary test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
echo "Created test directory: $TEST_DIR"

# Function to show section headers
section() {
  echo
  echo "============================================"
  echo "  $1"
  echo "============================================"
  echo
}

# Function to run command and show output
run_cmd() {
  echo "$ $1"
  echo
  eval "$1"
  echo
}

section "1. Initialize Issue Tracking"
run_cmd "issue-cards init"

section "2. Create a Feature Issue"
run_cmd "issue-cards create feature --title \"Implement user authentication\" \
  --problem \"Users need to securely log in to access their personalized content.\" \
  --approach \"We'll implement JWT-based authentication with secure cookies.\" \
  --tasks \"Create User model #unit-test
Create login endpoint #e2e-test
Implement authentication middleware
Add logout functionality\" \
  --instructions \"Follow OWASP security guidelines.\""

section "3. List Issues"
run_cmd "issue-cards list"

section "4. Show Issue Details"
run_cmd "issue-cards show 1"

section "5. View Current Task"
run_cmd "issue-cards current"

section "6. Add a Question"
run_cmd "issue-cards add-question \"What should be the token expiration time?\""

section "7. Log a Failed Approach"
run_cmd "issue-cards log-failure \"Tried using localStorage but it was vulnerable to XSS attacks\""

section "8. Show Issue with Added Context"
run_cmd "issue-cards show 1"

section "9. View Current Task with Added Context"
run_cmd "issue-cards current"

section "10. Add a Task"
run_cmd "issue-cards add-task \"Add password reset functionality\" --tags \"e2e-test\""

section "11. Complete Current Task"
run_cmd "issue-cards complete-task"

section "12. Complete Another Task"
run_cmd "issue-cards complete-task"

section "13. Add a Note"
run_cmd "issue-cards add-note \"We should consider adding rate limiting for login attempts\""

section "14. View Templates"
run_cmd "issue-cards templates"

section "15. View Specific Template"
run_cmd "issue-cards templates feature"

section "16. Complete Remaining Tasks"
run_cmd "issue-cards complete-task"
run_cmd "issue-cards complete-task"
run_cmd "issue-cards complete-task"

section "17. List Issues Again"
run_cmd "issue-cards list"

section "18. Create a Bugfix Issue"
run_cmd "issue-cards create bugfix --title \"Fix authentication error handling\" \
  --problem \"Error messages during login are not user-friendly.\" \
  --approach \"Standardize error handling and improve user messages.\" \
  --tasks \"Identify error cases #unit-test
Improve error messages
Add client-side validation\""

section "19. List Multiple Issues"
run_cmd "issue-cards list"

echo
echo "Test script completed successfully!"
echo "You can explore the test directory at: $TEST_DIR"
echo "When finished, you can remove it with: rm -rf $TEST_DIR"