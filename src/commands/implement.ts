import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { assertActiveProject } from '../state/validation.js';
import { readProjectStatus, writeProjectStatus } from '../state/project-status.js';
import { taskTemplatePath, tasksPath, taskDetailPath } from '../utils/paths.js';
import { atomicWrite } from '../utils/atomic-write.js';
import { success, error } from '../utils/output.js';
import { loadConfig } from '../utils/config.js';
import { parseTasks, findNextTask } from '../utils/task-parser.js';

const AI_COMMENT_INSTRUCTION =
  'You MUST add `@@AI@@:` comments to every code change explaining WHY the change was made.';

export async function implement(): Promise<void> {
  let projectName: string;
  try {
    projectName = await assertActiveProject();
  } catch (err) {
    error('NO_ACTIVE_PROJECT', err instanceof Error ? err.message : String(err));
    return;
  }

  const projectStatus = await readProjectStatus(projectName);
  if (projectStatus.status === 'REVIEW') {
    error(
      'REVIEW_PHASE',
      'Project is in REVIEW status. Use `sitter apply` to continue, or finish review first.'
    );
    return;
  }

  // Read global TASK.md template, treat missing as empty
  let taskTemplate = '';
  const templatePath = taskTemplatePath();
  if (existsSync(templatePath)) {
    try {
      taskTemplate = await readFile(templatePath, 'utf-8');
    } catch {
      // Treat read errors as empty
      taskTemplate = '';
    }
  }

  // Read project tasks.md
  const projectTasksPath = tasksPath(projectName);
  if (!existsSync(projectTasksPath)) {
    success({ completed: true });
    return;
  }

  let tasksContent: string;
  try {
    tasksContent = await readFile(projectTasksPath, 'utf-8');
  } catch (err) {
    error('READ_ERROR', err instanceof Error ? err.message : String(err));
    return;
  }

  const tasks = parseTasks(tasksContent);
  const nextTask = findNextTask(tasks);

  if (nextTask === null) {
    success({ completed: true });
    return;
  }

  // Store current task in project status
  await writeProjectStatus(projectName, { status: 'IMPLEMENT', currentTask: nextTask.id });

  // Build task content for response
  const taskContent = taskTemplate
    ? `${taskTemplate.trim()}\n\n---\n\n${nextTask.body}`
    : nextTask.body;

  // Extract description from body (everything before the first step line)
  const bodyLines = nextTask.body.split('\n');
  const firstStepIndex = bodyLines.findIndex((line) =>
    line.trimStart().startsWith('- [')
  );
  const description =
    firstStepIndex >= 0
      ? bodyLines.slice(0, firstStepIndex).join('\n').trim()
      : nextTask.body.trim();

  // Create taskX.md template file
  const detailContent = `# TASK ${nextTask.id}

## OG Description

${description}

## Discovery

## Decisions

## User Changes
`;

  try {
    await atomicWrite(taskDetailPath(projectName, String(nextTask.id)), detailContent);
  } catch (err) {
    error('WRITE_ERROR', err instanceof Error ? err.message : String(err));
    return;
  }

  // Load config for AI comment instruction
  const config = loadConfig();
  let finalContent = taskContent;
  let aiComments = false;

  if (config.review.ai_comments) {
    finalContent += `\n\n${AI_COMMENT_INSTRUCTION}`;
    aiComments = true;
  }

  success({
    task_id: nextTask.id,
    task_content: finalContent,
    ai_comments: aiComments,
  });
}
