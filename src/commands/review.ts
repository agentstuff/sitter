import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { assertActiveProject } from '../state/validation.js';
import { readProjectStatus, writeProjectStatus } from '../state/project-status.js';
import { tasksPath } from '../utils/paths.js';
import { atomicWrite } from '../utils/atomic-write.js';
import { success, error } from '../utils/output.js';
import { parseTasks, markTaskComplete } from '../utils/task-parser.js';

export async function review(): Promise<void> {
  let projectName: string;
  try {
    projectName = await assertActiveProject();
  } catch (err) {
    error('NO_ACTIVE_PROJECT', err instanceof Error ? err.message : String(err));
    return;
  }

  let projectStatus;
  try {
    projectStatus = await readProjectStatus(projectName);
  } catch (err) {
    error('READ_ERROR', err instanceof Error ? err.message : String(err));
    return;
  }

  if (projectStatus.status === 'REVIEW') {
    error('ALREADY_REVIEW', 'Already in review phase');
    return;
  }

  if (projectStatus.status !== 'IMPLEMENT') {
    error('UNEXPECTED_STATUS', `Project is in unexpected status: ${projectStatus.status}`);
    return;
  }

  if (projectStatus.currentTask === null) {
    error('NO_CURRENT_TASK', 'No active task to review. Run `sitter implement` first.');
    return;
  }

  // Validate against tasks.md (single source of truth for steps)
  const projectTasksPath = tasksPath(projectName);
  if (!existsSync(projectTasksPath)) {
    error('NO_TASKS_FILE', 'No tasks.md found for this project.');
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
  const currentTask = tasks.find((t) => t.id === projectStatus.currentTask);

  if (!currentTask) {
    error(
      'TASK_NOT_FOUND',
      `Task ${projectStatus.currentTask} not found in tasks.md.`
    );
    return;
  }

  const hasUncheckedSteps = currentTask.steps.some((step) => !step.checked);
  if (hasUncheckedSteps) {
    const uncheckedSteps = currentTask.steps
      .filter((s) => !s.checked)
      .map((s) => `- ${s.text}`);
    error(
      'TASK_NOT_COMPLETE',
      `Task ${projectStatus.currentTask} has incomplete steps in tasks.md:\n` +
        uncheckedSteps.join('\n') +
        '\nMark all steps as [X] before running review.'
    );
    return;
  }

  // Mark title checkbox as [X]
  const updatedContent = markTaskComplete(tasksContent, projectStatus.currentTask);
  if (updatedContent !== tasksContent) {
    try {
      await atomicWrite(projectTasksPath, updatedContent);
    } catch (err) {
      error('WRITE_ERROR', err instanceof Error ? err.message : String(err));
      return;
    }
  }

  await writeProjectStatus(projectName, { status: 'REVIEW', currentTask: null });
  success({ reviewed: true, status: 'REVIEW' });
}
