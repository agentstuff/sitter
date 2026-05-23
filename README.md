<p align="center">
  <img src="docs/logo.png" alt="Sitter Logo">
</p>

<p align="center">
  <strong>Babysit Your AI.</strong>
</p>

---

<p align="center">
  <a href="https://github.com/esemve/sitter/actions/workflows/ci.yml"><img src="https://github.com/esemve/sitter/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.npmjs.com/package/@agentstuff/sitter"><img src="https://img.shields.io/npm/dt/@agentstuff/sitter.svg" alt="npm downloads"></a>
</p>

---
<p align="center">
  🇺🇸 <a href="README.md">English</a> | 🇭🇺 <a href="docs/README.hu-HU.md">Magyar</a> | 🇩🇪 <a href="docs/README.de-DE.md">Deutsch</a> | 🇫🇷 <a href="docs/README.fr-FR.md">Français</a> | 🇪🇸 <a href="docs/README.es-ES.md">Español</a> | 🇯🇵 <a href="docs/README.ja-JP.md">日本語</a> | 🇨🇳 <a href="docs/README.zh-CN.md">简体中文</a>
</p>

---

<p align="center">
    <strong>Do you like it? Buy me a coffee!</strong> <br>
    <a href="https://www.paypal.com/donate/?hosted_button_id=ZHEVE2ZB69YR6" target="_blank"><img src="docs/donate.png" alt="Buy me a coffee!" height="50"></a>
</p>

---

<p align="center">
    <a href="#installation">Installation</a>  |
    <a href="#flowchart">Flowchart</a> |
    <a href="#skills">Skills</a> 
</p>


---


## What is it?

Sitter is a lightweight AI-native workflow manager that helps you run structured development cycles with your AI coding agent. It breaks work into visions, plans, tasks, and reviews — all tracked in markdown files inside your repo. 

## What problems does it solve?

When working with large codebases in agentic development, we face several problems:

- Drifting 
- Feedback loops that happen too late
- Incorrect implementations
- It is not possible to create a sufficiently detailed specification upfront, and continuously refining it is extremely time-consuming.
- Excessive amounts of generated code, hard to review it
- Difficult reviews, where it is hard to understand the reasoning and motivations behind the LLM’s decisions

**Sitter aims to help solve these issues.**

With Sitter, you can use a development loop with extremely early feedback cycles. Sitter breaks work down into small tasks, leaves technical comments in the code to explain the reasoning and decisions behind the implementation, and requests a review after every task.

During the review process, whether you modify the code yourself or ask the AI to do it, Sitter replans the remaining tasks and updates the overall plan accordingly. This prevents the system from rigidly following an upfront plan and instead allows it to continuously adapt based on what was clarified during the review process.

During implementation, the AI adds a comment before every code change, making the LLM’s reasoning transparent, simplifying review, and allowing drift to be detected and corrected early.

## Supported agents

| Tool            | Install                           |
|-----------------|-----------------------------------|
| **Claude Code** | `sitter install --agent=claude`   |
| **Kilo CLI**    | `sitter install --agent=kilo`     |
| **OpenCode**    | `sitter install --agent=opencode` |


## Installation

```bash
npm install -g @agentstuff/sitter
```

This installs the `sitter` CLI command globally.
```bash
sitter install
```

This installs the Sitter skills into your AI agent.

## How to use?

```bash
sitter init
```

This initializes the `sitter/` directory structure in your project.
Then run the Sitter skills in order to manage your project:

1. `/sitter-vision` — Create a new project vision.
2. `/sitter-brainstorm` — Clarify requirements by asking questions.
3. `/sitter-plan` — Generate a detailed implementation plan and task list.
4. `/sitter-implement` — Execute tasks one by one with review after each.
5. `/sitter-apply` — Apply reviewed changes and continue.
6. `/sitter-done` — Archive the completed project.


---

## Flowchart

```                                                            
                 ┌────────────────┐              
                 │                │              
                 │     VISION     │              
                 │                │────┐              
                 └───────┬────────┘    │                                                       
                         │             │              
                 ┌───────▼────────┐    │              
                 │                │    │              
                 │    BRAINSTORM  │    │
                 │                │    │              
                 └───────┬────────┘    │                                   
                         │             │              
                 ┌───────▼────────┐    │              
                 │                │    │              
                 │     PLAN       │    │              
             ┌───┼                ◄────┘              
             │   └───────┬────────┘              
             │           │              
             │   ┌───────▼────────┐              
             │   │                │              
      YOLO   │   │    IMPLEMENT   ◄────────┐              
             │   │                │        │               
             │   └───────┬────────┘        │                      
             │           │                 │ CHANGE
             │   ┌───────▼────────┐        │
             │   │                │        │
             └───►     REVIEW     │────────┘
                 │                │                     
                 └───────┬────────┘                                       
                         │                     
                 ┌───────▼────────┐                     
                 │                │                     
                 │     DONE       │                     
                 │                │                     
                 └────────────────┘                                                                     
                      
```

---

## Skills

| Skill | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|-------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/sitter-vision` | Creates a new project vision and initializes the project folder. Creates the `vision.md`.  After this, you can describe your vision in detail in this file — exactly what the task is and what you ultimately want to achieve. After this, you can describe your vision in detail in this file - exactly what the task is and what you ultimately want to achieve.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/sitter-brainstorm` | Asks clarifying questions and refines the vision document. This command works based on the vision.md file. If the file is empty, it will keep asking you questions until it fully understands what you want to build. It primarily evaluates the plan from a product perspective rather than a technical one, and tries to identify potential edge cases.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/sitter-plan` | Builds a detailed `plan.md` and breaks work into `tasks.md`. Based on the vision.md, it generates a technical specification and a series of small, logically sequential tasks. These can be overridden if needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `/sitter-implement` | Implements the next pending task, marks it complete, and waits for review. It finds the next unfinished task and implements it. When finished, it requests a review from the user. If the `ai_comments` value in `sitter/settings.yaml` is set to true, it adds comments prefixed with `@@AI@@:` to every code change, explaining in detail why that specific change was necessary and what it does. During the review phase, if any requested modification affects the plan or upcoming tasks (for example, renaming a library or refactoring code structure), it automatically updates them according to the new requirements. If you modify the code yourself — for example by editing or renaming variables — make sure to inform the AI about it. It will review the changes and, if necessary, update the plan and the remaining tasks accordingly. In the review phase, you prove that you have properly reviewed the code by removing all `@@AI@@` comments from everywhere. A new implementation cannot be requested until this step has been completed. |
| `/sitter-yolo` | Implements all remaining tasks continuously, reviewing only at the end.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/sitter-apply` | Validates that no AI comments remain and transitions the project back to IMPLEMENT. You can accept the AI’s changes with the Apply command. It is important that Apply can only be requested if **there are NO** `@@AI@@` comments anywhere in the codebase. You prove that the review has been completed by removing all of these comments from everywhere in the code. Once this is done, Apply re-enables the AI to continue implementation, meaning `/sitter-implement` becomes available again so the AI can start working on the next batch of tasks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `/sitter-done` | Archives the project to the archive folder and cleans up.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

---

## @@AI@@ comments

If `review/ai_comments` is set to `true` in `sitter/settings.yaml`, then during implementation the AI must prepend every code change with an @@AI@@ comment, explaining in detail why the change was necessary, the technical reasoning behind it, and exactly what it does. The purpose is to make the review phase easier by ensuring the reviewer — you — can clearly understand the AI’s decision-making process behind each modification.

During the review phase, you prove that you have actually reviewed the code by removing all @@AI@@ comments. If any @@AI@@ comment remains anywhere in the code, the Apply step will not be accepted, since it indicates the review has not been properly completed.

If you don’t like this feature, you can simply set its value to `false` in `settings.yaml`.

---

## TASK.md

There is a `TASK.md` file inside the `sitter` directory. Before starting each task, the AI reads this file and also takes the instructions found in it into account during implementation.

It is empty by default, but it can be used to provide additional implementation-specific instructions to the agents.

---
## License

MIT - Free as 🇭🇺Hungary🇭🇺
