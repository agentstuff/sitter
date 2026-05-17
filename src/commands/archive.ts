import { readdir, readFile, mkdir, stat, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { assertInitialized } from '../utils/validation.js';
import { assertActiveProject } from '../state/validation.js';
import { readProjectStatus } from '../state/project-status.js';
import { success, error } from '../utils/output.js';
import { projectDir, sitterArchiveDir, planPath } from '../utils/paths.js';

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

  const projDir = projectDir(projectName);
  const allEntries = await readdir(projDir, { recursive: true });
  const files: string[] = [];
  let wallOfText = '';

  for (const entry of allEntries) {
    const fullPath = join(projDir, entry);
    const entryStat = await stat(fullPath);
    if (entryStat.isFile()) {
      files.push(entry);
      const content = await readFile(fullPath, 'utf-8');
      wallOfText += `--- FILE: ${entry} ---\n${content}\n`;
    }
  }

  // Copy plan.md into archive directory if it exists
  const planFilePath = planPath(projectName);
  if (existsSync(planFilePath)) {
    const planContent = await readFile(planFilePath, 'utf-8');
    await writeFile(join(archiveDir, 'plan.md'), planContent, 'utf-8');
  }

  // Write wall_of_text into archive directory
  await writeFile(join(archiveDir, 'wall-of-text.txt'), wallOfText, 'utf-8');

  success({ archive_name: archiveName, files, wall_of_text: wallOfText });
}
