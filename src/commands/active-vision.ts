import { readFile } from 'fs/promises';
import { assertInitialized } from '../utils/validation.js';
import { assertActiveProject } from '../state/validation.js';
import { visionPath } from '../utils/paths.js';
import { success, error } from '../utils/output.js';

export async function activeVision(): Promise<void> {
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

  try {
    const content = await readFile(visionPath(projectName), 'utf-8');
    success({ project: projectName, content });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      error('VISION_NOT_FOUND', `vision.md not found for project "${projectName}"`);
      return;
    }
    error('READ_ERROR', err instanceof Error ? err.message : String(err));
  }
}
