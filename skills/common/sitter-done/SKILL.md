---
name: sitter-done
description: Archive a completed project, generate an OpenSpec-compatible specification, and clean up the project files.
---

# /sitter-done

## Purpose

Finalize a Sitter project by archiving it, generating an OpenSpec-compatible `spec.md`, and cleaning up the active project files.

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
   - If the status is `REVIEW`, inform the user with an error:
     "Cannot archive: the project is in REVIEW status. Please apply all pending changes with `/sitter-apply` before archiving."
   - STOP. Do not proceed further.

3. **Archive the project.**
   Execute:
   ```
   sitter archive
   ```
   The CLI will:
   - Return all project files from the `sitter` folder as a string.
   - Create an archive folder named `YYYY_mm_dd_PROJECTNAME` inside the archive directory.
   - Copy the original `plan.md` into the archive.

4. **Read all project files.**
   - Read all files from `sitter/projects/<PROJECT_NAME>/`.
   - Include `vision.md`, `plan.md`, `tasks.md`, and all `taskX.md` files.

5. **Generate OpenSpec-compatible `spec.md`.**
   - Create a file named `spec.md` inside the archive folder (`archive/YYYY_mm_dd_PROJECTNAME/`).
   - The specification MUST be OpenSpec-compatible.
   - Include all functional requirements, architecture decisions, and implementation details derived from the project files.
   - The AI MUST communicate with the user in the same language the user is speaking.

6. **Drop the project.**
   Execute:
   ```
   sitter project --drop="PROJECTNAME"
   ```
   Replace `PROJECTNAME` with the actual project name.
   The CLI will:
   - Delete the project files from `sitter/projects/`.
   - Set `active-project` to `null` in `sitter/.status.json`.

7. **Report success.**
   Inform the user: "Project archived successfully. All files have been moved to the archive and the project has been cleaned up."

## Error Handling

- If `sitter status` indicates `REVIEW`, refuse to proceed as per step 2.
- If `sitter archive` fails, report the exact error and ask the user how to proceed.
- If reading project files fails, report the filesystem error.
- If `sitter project --drop="..."` fails, report the error. Do NOT manually delete files unless the CLI confirms the drop succeeded.
- If `spec.md` generation fails, retry once. If it still fails, report the error.

