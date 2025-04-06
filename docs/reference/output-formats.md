# Output Format

This document explains the output format conventions used by the Issue Cards CLI.

## Output Streams

Issue Cards follows standard conventions for output streams:

- **Standard Output (stdout)**: Used for command results, success messages, and information that represents the expected output of a command.
- **Standard Error (stderr)**: Used for error messages, warnings, and debug information.

## Verbosity Levels

Issue Cards supports multiple verbosity levels that can be controlled with command-line flags:

- **Quiet Mode** (`--quiet` or `-q`): Minimal output, only errors are displayed. Useful for scripts.
- **Normal Mode** (default): Standard output with all necessary information.
- **Verbose Mode** (`--verbose` or `-v`): Additional details about operations.
- **Debug Mode** (`--debug` or `-d`): Maximum detail including internal operations.

## Output Formatting

### Success Messages

Success messages indicate successful completion of operations:

```
✅ Issue saved to .issues/open/issue-0001.md
```

### Error Messages

Error messages indicate failures:

```
❌ Issue tracking is not initialized. Run `issue-cards init` first.
```

### Information Messages

Information messages provide context:

```
ℹ️ Available issue templates:
```

### Warning Messages

Warning messages alert about potential issues:

```
⚠️ Template contains validation errors
```

### Debug Messages

Debug messages appear only in debug mode:

```
🐞 Attempting to read file: /path/to/file
```

### Sections

Sections group related information:

```
CURRENT TASK:
Implement output manager

NEXT TASK:
Update command tests
```

## Machine-Readable Output

Issue Cards supports JSON output format for machine parsing:

```
$ issue-cards list --json
{"type":"list","items":["#0001: Fix output format bug","#0002: Add search feature"],"count":2}
```

## Exit Codes

Issue Cards uses standardized exit codes to indicate the outcome of commands:

- **0**: Success
- **1**: General error
- **2**: User error (invalid input)
- **3**: System error (environment issues)
- **4**: Internal error (unexpected behavior)

## Global Options

The following global options affect output:

| Option | Description |
|--------|-------------|
| `--quiet`, `-q` | Minimal output (errors only) |
| `--verbose`, `-v` | Additional detailed output |
| `--debug`, `-d` | Maximum debug information |
| `--no-color` | Disable colored output |
| `--json` | Output in JSON format |

## Example Output

### Normal Output

```
$ issue-cards current

TASK: Implement new output manager

CURRENT TASK:
Implement new output manager

TASKS:
1. Create outputManager.js module
2. Implement error handling
3. Update commands to use new system

CONTEXT:
Problem to be solved:
Inconsistent console output and error handling

Planned approach:
Create a centralized output manager

NEXT TASK:
Update tests for new output system
```

### Quiet Output

```
$ issue-cards current -q
# No output on success, only errors would be shown
```

### JSON Output

```
$ issue-cards current --json
{"type":"task","text":"Implement new output manager","steps":["Create outputManager.js module","Implement error handling","Update commands to use new system"],"context":{"problem":"Inconsistent console output and error handling","approach":"Create a centralized output manager"},"next":"Update tests for new output system"}
```