import { mkdir, copyFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { assertInitialized } from '../utils/validation.js';
import { assertActiveProject } from '../state/validation.js';
import { readProjectStatus } from '../state/project-status.js';
import { readGlobalStatus, writeGlobalStatus } from '../state/global-status.js';
import { success, error } from '../utils/output.js';
import { projectDir, sitterArchiveDir, planPath, tasksPath } from '../utils/paths.js';

export async function archive(): Promise<void> {
  try {
    assertInitialized();
  } catch (err) {
    error('NOT_INITIALIZED', err instanceof Error ? err.message : String(err));
    return;
  }

  let projectName: string;
  try {
    projectName = await assertActiveProject();
  } catch (err) {
    error('NO_ACTIVE_PROJECT', err instanceof Error ? err.message : String(err));
    return;
  }

  const projectStatus = await readProjectStatus(projectName);
  if (projectStatus.status === 'REVIEW') {
    error('REVIEW_PHASE', 'Cannot archive during review phase');
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const archiveName = `${year}_${month}_${day}_${projectName}`;
  const archiveDir = join(sitterArchiveDir(), archiveName);

  await mkdir(archiveDir, { recursive: true });

  const archivedFiles: string[] = [];

  const tasksFile = tasksPath(projectName);
  if (existsSync(tasksFile)) {
    await copyFile(tasksFile, join(archiveDir, 'tasks.md'));
    archivedFiles.push('tasks.md');
  }

  const planFile = planPath(projectName);
  if (existsSync(planFile)) {
    await copyFile(planFile, join(archiveDir, 'plan.md'));
    archivedFiles.push('plan.md');
  }

  await rm(projectDir(projectName), { recursive: true });

  const globalStatus = await readGlobalStatus();
  globalStatus.activeProject = null;
  await writeGlobalStatus(globalStatus);

  success({ success: true, archive_name: archiveName, archived_files: archivedFiles });
}
