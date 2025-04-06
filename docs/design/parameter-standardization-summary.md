# Parameter Standardization Summary

## Overview

This document summarizes the work done to standardize parameter naming throughout the `issue-cards` application. The goal was to create a consistent and intuitive command-line interface by using standardized parameter descriptors across all commands.

## Standardization Principles

1. **Consistent parameter descriptor format**: All parameter descriptors now use camelCase for multi-word names, enclosed in angle brackets (e.g., `<issueNumber>`, `<templateType>`)

2. **Descriptive parameter names**: Parameter descriptors now clearly indicate their purpose (e.g., `<issueTitle>` instead of `<title>`, `<sectionName>` instead of `<n>`)

3. **Matching long-form options**: Parameter descriptors align with their corresponding long-form option names (e.g., `--issue <issueNumber>`)

## Changes Made

### Issue Command Parameters
- Standardized `<number>` to `<issueNumber>` across all commands:
  - `show.js`: `-i, --issue <issueNumber>`
  - `addNote.js`: `-i, --issue <issueNumber>`
  - `addQuestion.js`: `-i, --issue <issueNumber>`
  - `logFailure.js`: `-i, --issue <issueNumber>`
  - `addTask.js`: `-i, --issue <issueNumber>`
  - `setCurrent.js`: `-i, --issue <issueNumber>` (required)

### Templates Command Parameters
- Made template parameters more descriptive:
  - `-t, --type <templateType>` (previously `<type>`)
  - `-n, --name <templateName>` (previously `<n>`)

### Section Parameter in addNote
- Made section parameter more descriptive:
  - `-s, --section <sectionName>` (previously `<n>`)

### Server Configuration Parameters
- Made server parameters more descriptive:
  - `-p, --port <port>` (previously `<number>`)
  - `-h, --host <hostname>` (previously `<string>`)
  - `-t, --token <authToken>` (previously `<string>`)

### Create Command Parameters
- Made create parameters more descriptive:
  - `--title <issueTitle>` (previously `<title>`)
  - `--problem <problemDesc>` (previously `<description>`)
  - `--approach <approachDesc>` (previously `<strategy>`)
  - `--failed-approaches <approachesList>` (previously `<list>`)
  - `--questions <questionsList>` (previously `<list>`)
  - `--task <taskDesc>` (previously `<task>`)
  - `--instructions <instructionsText>` (previously `<guidelines>`)
  - `--next-steps <nextStepsList>` (previously `<list>`)

## Impact and Benefits

1. **Improved usability**: The command-line interface is now more intuitive with descriptive parameter names that clearly indicate their purpose.

2. **Better documentation**: The standardized naming provides better self-documentation in command help text.

3. **Consistency**: Parameters now follow a consistent naming pattern across all commands, making the application easier to learn and use.

4. **Code maintainability**: The consistent naming convention makes the codebase more maintainable for future development.

## Future Considerations

1. **Short-form options**: Consider adding short-form options for commonly used parameters that currently only have long forms.

2. **Further JSDoc standardization**: Update all JSDoc comments to match the standardized parameter names.

3. **Parameter validation**: Enhance validation for parameters to ensure they match the expected format.