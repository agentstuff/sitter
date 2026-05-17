---
name: sitter-merge-sync
description: Merge delta specifications from a project into the central sitter/specs/ directory.
---

# /sitter-merge-sync

## Purpose

Synchronize delta specification files from the active project into the central `sitter/specs/` directory. This is a SEPARATE step and is NOT part of `/sitter-done`.

## Preconditions

- A Sitter project MUST be active.
- The project MUST contain a `sitter/projects/PROJECTNAME/specs/` directory with delta spec files.
- The central `sitter/specs/` directory MUST exist.

## Instructions

1. **Execute the merge.**
   Run:
   ```
   sitter merge
   ```

2. **Understand the merge behavior.**
   The CLI will:
   - Read delta spec files from `sitter/projects/PROJECTNAME/specs/`.
   - Merge them into the corresponding domain spec files in `sitter/specs/`.
   - Match requirements by exact name under `### Requirement: <Name>` headers.
   - Apply operations in this order: RENAMED → REMOVED → MODIFIED → ADDED.
   - For MODIFIED: replace the ENTIRE requirement text, not just the delta.
   - Treat the merge as transactional: if any error occurs, NO files are modified.

3. **Handle errors.**
   - If the project does not contain a `specs/` subdirectory, the CLI will report an error.
   - If any merge conflict or validation error occurs, the transaction is aborted and the CLI reports the error.
   - Report the exact error to the user and ask how to proceed.

4. **Report results.**
   - On success, inform the user which domain specifications were updated.
   - Be specific: list the exact domain spec files that changed.
   - The AI MUST communicate with the user in the same language the user is speaking.

## Important Notes

- This command is a STANDALONE step.
- It MUST NOT be invoked automatically as part of `/sitter-done`.
- The user MUST explicitly request this merge.
- Always verify the `sitter/specs/` directory exists before running.

## Error Handling

- If `sitter merge` fails with "no specs directory", inform the user that the project has no delta specs to merge.
- If a transactional failure occurs, report which requirement caused the issue and advise the user to inspect the delta spec files.
- If the central `sitter/specs/` directory is missing, report the missing directory and ask the user to initialize it.

