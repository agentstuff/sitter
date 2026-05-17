---
name: sitter-brainstorm
description: Clarify and refine the project vision by asking structured questions and continuously updating the vision document.
---

# /sitter-brainstorm

## Purpose

Refine the active project vision through iterative questioning, providing solution options, and updating the `vision.md` file with new information.

## Preconditions

- A Sitter project MUST be active (set via `/sitter-vision`).
- The active project's `vision.md` MUST exist.

## Instructions

1. **Retrieve the active project.**
   Execute:
   ```
   sitter status
   ```
   Parse the output to identify the active project name.

2. **Read the vision document.**
   Locate and read the file `sitter/projects/<PROJECT_NAME>/vision.md`.
   If the file does not exist, ask the user: "What new feature would you like to develop?"

3. **Ask clarifying questions.**
   - Based on the vision content, ask the user questions until you fully understand what needs to be built.
   - For EVERY question, you MUST provide 2–3 concrete solution options.
   - You MUST explicitly state that the user can either choose one of the provided options OR provide their own solution.
   - The AI MUST communicate with the user in the same language the user is speaking.

4. **Update `vision.md` continuously.**
    - After each user response, append or update the new information in `sitter/projects/<PROJECT_NAME>/vision.md`.
    - Preserve existing content; add new clarifications as new sections or bullet points.
    - **All markdown files MUST be written in English.**

5. **Determine completion.**
   - When you have no further questions and fully understand the requirements, inform the user.
   - Tell the user: "I have no more questions. Please invoke `/sitter-plan` to create the implementation plan."

## Error Handling

- If `sitter status` returns no active project, instruct the user to run `/sitter-vision` first.
- If `vision.md` is missing, ask the user what feature they want to develop and create the file with their answer.
- If writing to `vision.md` fails, report the filesystem error and retry once.

