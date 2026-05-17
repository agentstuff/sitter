---
name: sitter-implement
description: Execute the next uncompleted task from the task list, creating a task plan and implementing it with user review between tasks.
---

# /sitter-implement

## Purpose

Implement the next pending task from `tasks.md`, create a detailed task plan, write decisions, and transition to review upon completion.

## Preconditions

- A Sitter project MUST be active.
- `plan.md` and `tasks.md` MUST exist.

## Instructions

1. **Check project status.**
   Execute:
   ```
   sitter status
   ```

2. **Handle REVIEW status.**
   - If the status is `REVIEW`, inform the user:
     "The project is currently in REVIEW status. Please use `/sitter-apply` to accept the previous changes before continuing implementation."
   - STOP. Do not proceed further.

3. **Handle IMPLEMENT status.**
   - If the status is `IMPLEMENT`, proceed to step 4.
   - If the status is neither `REVIEW` nor `IMPLEMENT`, report the unexpected status to the user and ask for guidance.

4. **Get the next task.**
   Execute:
   ```
   sitter implement
   ```
   The CLI will:
   - Find the first unchecked task in `tasks.md`.
   - Return the full task section from `tasks.md` (heading + description + checkboxes), prepended with the contents of `sitter/TASK.md`.
   - Create `sitter/projects/<PROJECT_NAME>/taskX.md` where `X` is the task number, for supplementary info (decisions, discovery, user changes only — no steps).

5. **Check `ai_comments` setting.**
   Read `sitter/settings.yaml`. If `ai_comments` is `true`, you MUST prepend the following instruction to your task context:
    "Whenever you create or modify ANY code, you MUST add a source code comment whose text starts with `@@AI@@:` explaining the change. The `@@AI@@:` marker MUST be inside a proper comment in the source language's native comment syntax — the comment text itself (after the language's comment markers) MUST begin with `@@AI@@:`. Examples by language:
    - JavaScript / TypeScript / PHP / C-style: `// @@AI@@: explanation`
    - Python / Shell / YAML: `# @@AI@@: explanation`
    - HTML / XML: `<!-- @@AI@@: explanation -->`
    - CSS / C-style block: `/* @@AI@@: explanation */`
    The comment MUST justify the technical reasoning, the thought process behind it, and why this approach is better than alternatives. For multi-line comments, every line of the comment MUST start with `@@AI@@:`.
     - **The comment text MUST be written in the same language the user is currently speaking. Do NOT write AI comments in English if the user is speaking another language.**"

6. **Plan the implementation.**
    - Write a detailed implementation plan into `taskX.md` under `## Discovery`.
    - Record architecture decisions and design choices in `## Decisions`.
    - **The `taskX.md` file itself MUST be written in English, as it is a Sitter project markdown file.**
    - **Steps and checkboxes are NOT stored in `taskX.md` — they live in `tasks.md` only.**

7. **Implement the task.**
   - Execute the plan step by step.
   - For EVERY significant decision during implementation, append a note to the `## Decisions` section in `taskX.md`.
   - If `ai_comments` is `true`, add `@@AI@@:` comments inside proper source code comments to all created or modified code as specified.
   - **As each step is completed, mark its checkbox as `[X]` in `tasks.md`.** This is the single source of truth for step status.

8. **Mark task complete.**
   When the task implementation is fully complete:
   - Mark ALL step checkboxes as `[X]` in `tasks.md`.
   - Do NOT mark the title checkbox `[X]` — `sitter review` handles that.
   - Execute:
     ```
     sitter review
     ```
   The CLI will:
   - Verify that all steps in `tasks.md` are `[X]` for the current task.
   - Mark the title checkbox as `[X]` in `tasks.md`.
   - Transition the project from IMPLEMENT to REVIEW status.
   - If any steps are still `[ ]`, `sitter review` will reject and tell you what remains.

9. **Request user review.**
    - Notify the user that the task is complete.
    - Ask the user to review the implementation.

10. **Handle user feedback.**
    - **Document the user's change request in the `## User Changes` section of `taskX.md`.** Record exactly what the user asked for and why.
    - **NEVER rewrite already-completed (`[X]`) steps in `tasks.md`.** The history of completed work must be preserved as-is.
    - If the change affects a **completed** (`[X]`) task, add a **new** follow-up checkbox step to that task in `tasks.md` describing the corrective action (e.g., `- [ ] Rename folder X to Y in already-completed files`). Do NOT alter the original `[X]` steps.
    - If the change affects the **current** task, add the new requirement as an unchecked (`- [ ]`) step in the current task in `tasks.md`. (Steps live only in `tasks.md` — no need to sync with `taskX.md`.)
    - If the change affects **future** tasks or the overall plan, update `plan.md` and redesign the remaining unchecked tasks in `tasks.md` to reflect the new reality.
    - Only unchecked (`[ ]`) tasks and steps should ever be edited or reordered. Completed (`[X]`) history is append-only.
    - If the user modifies code directly, detect the changes, accept them, and adapt the plan accordingly while preserving the completed task history.

11. **Transition guidance.**
    - If AI comments were added, remind the user to remove ALL `@@AI@@:` comments and then invoke `/sitter-apply`.
    - If `ai_comments` was disabled, remind the user to invoke `/sitter-apply`.

## Error Handling

- If `sitter status` fails, report the CLI error.
- If `sitter implement` returns no task, check if all tasks are already complete. If so, inform the user.
- If `taskX.md` creation fails, retry once and report the error.
- If `settings.yaml` is missing, assume `ai_comments` is `false`.
