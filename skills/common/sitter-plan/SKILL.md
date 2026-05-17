---
name: sitter-plan
description: Create a detailed implementation plan and task breakdown based on the active project vision.
---

# /sitter-plan

## Purpose

Generate a comprehensive implementation plan (`plan.md`) and a granular task list (`tasks.md`) for the active project.

## Preconditions

- A Sitter project MUST be active.
- The active project's `vision.md` MUST exist and contain clarified requirements.

## Instructions

1. **Retrieve the full vision.**
   Execute:
   ```
   sitter active-vision
   ```
   Capture the entire output (the contents of the active project's `vision.md`).

2. **Analyze and plan.**
   Based on the vision, create an implementation plan examining:
   - **Efficiency**: Is the approach optimal? Are there unnecessary steps?
   - **Patterns**: Are there existing patterns, libraries, or architectural conventions to follow?
   - **Risks**: What could go wrong during implementation?
   - **Security**: Are there authentication, authorization, data handling, or input validation concerns?
   - **Edge cases**: What scenarios might break the implementation?
   - **Dependencies**: What external libraries, APIs, or services are needed?
   - **Senior-level scrutiny**: Apply the same critical thinking a senior developer would.

3. **Resolve implementation questions.**
   - If you have ANY implementation questions, ask the user BEFORE writing the plan.
   - For each question, provide 2–3 solution options.
   - Explicitly state that the user can choose an option OR provide their own.
   - Repeat until you are completely confident in the plan.
   - The AI MUST communicate with the user in the same language the user is speaking.

4. **Write `plan.md`.**
   - Create or overwrite `sitter/projects/<PROJECT_NAME>/plan.md`.
   - Structure the plan with clear sections (Overview, Architecture, Risks & Mitigations, Security Considerations, etc.).
   - Use RFC 2119 keywords (MUST, SHOULD, MAY, SHALL) where appropriate.
   - **All markdown files MUST be written in English.**

5. **Write `tasks.md`.
   - Create or overwrite `sitter/projects/<PROJECT_NAME>/tasks.md`.
   - Use the following Markdown format:

      ```markdown
      # TASKS: Project Name

      ## [ ] Task 1: Title of the task
      - [ ] Step description
      - [ ] Another step

      ## [ ] Task 2: Another task
      - [ ] Step description
      ```

    - The task heading MUST include a checkbox: `## [ ] Task N: Title` (e.g., `## [ ] Task 1: Create the core logic`).
   - Steps MUST use checklist syntax: `- [ ] description`.
   - When a task is complete, the title MUST be updated to `## [X] Task N: Title` (e.g., `## [X] Task 1: Create the core logic`).
    - Each task MUST:
      - Contain ALL details needed for an independent AI agent with zero prior context to understand and execute it correctly.
      - Be the smallest meaningfully committable unit of work.
      - Use RFC 2119 keywords (MUST, SHOULD, MAY, SHALL) for requirements.
    - **All markdown files MUST be written in English.**

6. **Confirm completion.**
   Inform the user that the plan and tasks are ready and they can invoke `/sitter-implement` or `/sitter-vibecode` to begin development.

## Error Handling

- If `sitter active-vision` fails or returns no output, verify that a project is active and `vision.md` exists.
- If writing `plan.md` or `tasks.md` fails, report the exact filesystem error and retry once.
- If the vision is ambiguous, do NOT proceed to writing files until clarifications are obtained from the user.

