# Issue 0012: Implement auto-discovering help command

## Problem to be solved
Our current help command only supports a few hardcoded topics. We need a help command that can discover and display documentation from markdown files.

## Planned approach
Implement a new help command that recursively scans the docs directory for markdown files, organizes them by category, and displays them in the terminal.

## Failed approaches


## Questions to resolve


## Tasks
- [x] Create discoverDocFiles() function to scan and categorize docs
- [x] Implement formatMarkdownForTerminal() for terminal display
- [x] Create listTopics() to show available documentation topics
- [x] Implement showTopic() to display specific documentation
- [x] Update help command to use new functionality
- [x] Add comprehensive examples to help command

## Instructions
Follow the implementation in the documentation plan. Ensure the help command works even if the docs directory structure is incomplete.

## Next steps

