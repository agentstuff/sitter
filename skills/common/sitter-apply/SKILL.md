---
name: sitter-apply
description: Transition the project from REVIEW status back to IMPLEMENT by validating AI comments and applying changes.
---

# /sitter-apply

## Purpose

Apply reviewed changes, validate that no AI comments remain in the codebase, and transition the project from `REVIEW` back to `IMPLEMENT` status.

## Preconditions

- A Sitter project MUST be active.
- The project status MUST be `REVIEW` (or `IMPLEMENT` with a message to the user).

## Instructions

1. **Check project status.**
   Execute:
   ```
   sitter status
   ```

2. **Handle IMPLEMENT status.**
   - If the status is `IMPLEMENT`, inform the user:
     "The project is in IMPLEMENT status. Please complete `/sitter-implement` first. Once the task is done, you can apply the changes."
   - STOP. Do not proceed further.

3. **Handle REVIEW status.**
   - If the status is `REVIEW`, proceed to step 4.
   - If the status is unexpected, report it and ask for guidance.

4. **Detect user changes during review.**
   - Scan the codebase for any modifications made by the user since the last `/sitter-implement` invocation.
   - If user changes affect the plan or remaining tasks, update `plan.md` and `tasks.md` accordingly.
   - Document the user's changes in the current `taskX.md`.

5. **Apply changes.**
   Execute:
   ```
   sitter apply
   ```
   The CLI will:
   - Scan the entire codebase for `@@AI@@:` comments.
   - If ANY are found, return `clean: false` along with the exact files and line numbers.
   - If NONE are found, transition the project from `REVIEW` to `IMPLEMENT` and return `clean: true`.

6. **Handle AI comments found.**
   - If `sitter apply` returns `clean: false` with `ai_comments`:
     - List the exact files and line numbers for the user.
     - Inform the user: "AI comments are still present in the code. Please remove ALL `@@AI@@:` comments before applying changes. Development cannot continue until they are removed."
     - STOP. Do not proceed further.
   - **Note:** AI comments are written in the language the user was speaking during implementation. They must still be removed before applying changes.

7. **Handle successful apply.**
   - If `sitter apply` returns `clean: true`, the project is now in `IMPLEMENT` status.
   - Internally invoke the `/sitter-implement` skill logic to continue with the next task, OR inform the user that they can now invoke `/sitter-implement`.

## Error Handling

- If `sitter status` fails, report the error.
- If `sitter apply` fails, report the exact error output and ask the user how to proceed.
- If `sitter apply` succeeds but the status remains `REVIEW`, report the discrepancy.
