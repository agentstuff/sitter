---
name: sitter-done
description: Archive a completed project and clean up the project files.
---

# /sitter-done

## Purpose

Finalize a Sitter project by archiving it and cleaning up the active project files.

## Preconditions

- A Sitter project MUST be active.
- The project status MUST NOT be `REVIEW`.
- All tasks SHOULD be completed.

## Instructions

1. **Check project status.**
   Execute:
   ```
   sitter status
   ```

2. **Refuse if in REVIEW.**
   - If the status is `REVIEW`, inform the user:
     "Cannot archive: the project is in REVIEW status. Please apply all pending changes with `/sitter-apply` before archiving."
   - STOP. Do not proceed further.

3. **Archive the project.**
   Execute:
   ```
   sitter archive
   ```
   The CLI will:
   - Create an archive folder named `YYYY_mm_dd_PROJECTNAME` inside `sitter/archive/`.
   - Copy `plan.md` and `tasks.md` into the archive folder.
   - Delete the original project folder.
   - Set the active project to null.

4. **Report success.**
   Inform the user: "Project archived successfully."

## Error Handling

- If `sitter status` indicates `REVIEW`, refuse to proceed as per step 2.
- If `sitter archive` fails, report the exact error and ask the user how to proceed.
