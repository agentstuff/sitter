import { mkdir } from 'fs/promises';
import {
  projectDir,
  visionPath,
} from '../utils/paths.js';
import { assertInitialized, validateProjectName } from '../utils/validation.js';
import { success, error, output } from '../utils/output.js';
import { projectExists } from '../state/projects.js';
import { writeProjectStatus } from '../state/project-status.js';
import { readGlobalStatus, writeGlobalStatus } from '../state/global-status.js';
import { atomicWrite } from '../utils/atomic-write.js';

export async function visionCreate(name: string): Promise<void> {
  try {
    assertInitialized();
  } catch (err) {
    error('NOT_INITIALIZED', err instanceof Error ? err.message : String(err));
    return;
  }

  try {
    validateProjectName(name);
  } catch (err) {
    error('INVALID_NAME', err instanceof Error ? err.message : String(err));
    return;
  }

  const lowerName = name.toLowerCase();

  if (projectExists(lowerName)) {
    output({ created: false, error: 'already_exists' });
    return;
  }

  await mkdir(projectDir(lowerName), { recursive: true });

  const visionContent = '# VISION\n\n';
  await atomicWrite(visionPath(lowerName), visionContent);

  await writeProjectStatus(lowerName, { status: 'IMPLEMENT', currentTask: null });

  const globalStatus = await readGlobalStatus();
  globalStatus.activeProject = lowerName;
  await writeGlobalStatus(globalStatus);

  success({ created: true, name: lowerName });
}
