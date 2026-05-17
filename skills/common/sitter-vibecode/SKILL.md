---
name: sitter-vibecode
description: Implement all remaining tasks in one continuous session, skipping per-task review until the very end.
---

# /sitter-vibecode

## Purpose

Execute all remaining tasks from `tasks.md` in a single continuous implementation session, providing status updates throughout, and transitioning to `REVIEW` only at the very end.

## Preconditions

- A Sitter project MUST be active.
- `plan.md` and `tasks.md` MUST exist.
- The project status MUST be `IMPLEMENT`.

## Instructions

1. **Check project status.**
   Execute:
   ```
   sitter status
   ```

2. **Handle REVIEW status.**
   - If the status is `REVIEW`, inform the user:
     "The project is in REVIEW status. Please use `/sitter-apply` before continuing."
   - STOP. Do not proceed further.

3. **Get the next task.**
   Execute:
   ```
   sitter implement
   ```
   This returns the first unchecked task and creates `taskX.md`.

4. **Check `ai_comments` setting.**
   Read `sitter/settings.yaml`. If `ai_comments` is `true`, you MUST prepend the instruction:
    "Whenever you create or modify ANY code, you MUST add a source code comment whose text starts with `@@AI@@:` explaining the change. The `@@AI@@:` marker MUST be inside a proper comment in the source language's native comment syntax — the comment text itself (after the language's comment markers) MUST begin with `@@AI@@:`. Examples by language:
    - JavaScript / TypeScript / PHP / C-style: `// @@AI@@: explanation`
    - Python / Shell / YAML: `# @@AI@@: explanation`
    - HTML / XML: `<!-- @@AI@@: explanation -->`
    - CSS / C-style block: `/* @@AI@@: explanation */`
    The comment MUST justify the technical reasoning, the thought process behind it, and why this approach is better than alternatives. For multi-line comments, every line of the comment MUST start with `@@AI@@:`.
     - **The comment text MUST be written in the same language the user is currently speaking. Do NOT write AI comments in English if the user is speaking another language.**"

5. **Implement the task continuously.**
    - Write the implementation plan to `taskX.md`. **The `taskX.md` file itself MUST be written in English, as it is a Sitter project markdown file.**
    - Execute the plan step by step.
    - Record all decisions in the `DECISIONS` block of `taskX.md`.
     - If `ai_comments` is `true`, add `@@AI@@:` comments inside proper source code comments to all code changes.
    - Mark the task as complete in `tasks.md`.

6. **Provide status updates.**
   - After each task, report to the user:
     - Which task was completed.
     - How many tasks remain.
     - Any notable decisions or risks encountered.
   - The AI MUST communicate with the user in the same language the user is speaking.

7. **Iterate through all tasks.**
   - Repeat steps 3–6 until `sitter implement` returns no more tasks (all tasks are complete).
   - Do NOT stop for per-task user review.

8. **Mark project complete for review.**
   When ALL tasks are implemented, execute:
   ```
   sitter review
   ```
   This transitions the project to REVIEW status.

9. **Final review transition.**
   - Inform the user:
     "All tasks have been implemented. The project is now in REVIEW status. Please review all changes."
   - Remind the user:
     - If `ai_comments` was enabled, remove ALL `@@AI@@:` comments before invoking `/sitter-apply`.
     - Otherwise, they can invoke `/sitter-apply` directly.

## Differences from `/sitter-implement`

| Aspect | `/sitter-implement` | `/sitter-vibecode` |
|---|---|---|
| Review timing | After each task | Only at the very end |
| Status updates | Per-task completion | Continuous progress reports |
| User interaction | High (review after each task) | Low (single final review) |
| Use case | Careful, validated development | Fast, continuous development |

## Error Handling

- If `sitter status` fails, report the error.
- If `sitter implement` fails mid-stream, report which task failed and why.
- If a task implementation fails, document the failure in `taskX.md`, update `tasks.md`, and ask the user whether to continue or abort.
- If the user requests changes during implementation, document the change request in the `## User Changes` section of `taskX.md`. **Never rewrite already-completed (`[X]`) steps in `tasks.md`.** If the change affects completed work, add a new follow-up checkbox step to that task. Only unchecked (`[ ]`) tasks and steps should be edited; completed history is append-only. Update `plan.md` if the change affects future tasks.
- If `settings.yaml` is missing, assume `ai_comments` is `false`.

