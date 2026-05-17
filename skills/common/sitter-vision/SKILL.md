---
name: sitter-vision
description: Create a new project vision by asking the user for a one-sentence summary, generating a project name, and initializing the project structure.
---

# /sitter-vision

## Purpose

Create a new Sitter project vision. This is the entry point of the development workflow.

## Preconditions

- The Sitter CLI MUST be installed and available (`sitter`).
- The user MUST have initialized Sitter in the current workspace (`sitter init`).

## Instructions

1. **Greet the user and ask the vision question.**
   Ask exactly: "Foglald össze 1 mondatban miről fogunk csinálni"
   The AI MUST communicate with the user in the same language the user is speaking.

2. **Receive the user's description.**
   Wait for the user to provide a one-sentence summary of what they want to build.

3. **Generate a project name (VISIONNEV).**
   - Derive a concise project name from the user's description.
   - The name MUST be maximum 20 characters.
   - Use only alphanumeric characters (A-Z, a-z, 0-9), underscores, or hyphens.
   - Convert to uppercase for the CLI command.

4. **Create the vision.**
   Execute the shell command:
   ```
   sitter vision --create="VISIONNEV"
   ```
   Replace `VISIONNEV` with the generated name.

5. **Handle the `already_exists` error.**
   - If the CLI returns an error indicating the vision name already exists, generate a new unique name by appending a number or shortening further.
   - Retry the `sitter vision --create="..."` command with the new name.
   - Repeat until the command succeeds. Do NOT ask the user for a different name unless the CLI explicitly requires it.

6. **Confirm creation.**
    - Upon success, the CLI creates `sitter/projects/VISIONNEV/vision.md` and sets the project as active in `sitter/.status.json`.
    - Inform the user that the vision file has been created at `sitter/projects/VISIONNEV/vision.md`.
    - **All markdown files MUST be written in English.**

7. **Guide the user to the next step.**
   Ask the user:
   - Would they like to sketch out their thoughts directly in `vision.md`, OR
   - Should they invoke `/sitter-brainstorm` to continue the workflow.

## Error Handling

- If `sitter` command is not found, inform the user that Sitter CLI must be installed and initialized.
- If any other CLI error occurs, report the exact error message to the user and ask how to proceed.
- If the `vision.md` file does not appear after successful CLI output, verify the path and report the discrepancy.

