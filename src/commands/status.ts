import { existsSync } from 'fs';
import { assertInitialized } from '../utils/validation.js';
import { output, error } from '../utils/output.js';
import { readGlobalStatus } from '../state/global-status.js';
import { readProjectStatus } from '../state/project-status.js';
import { projectDir } from '../utils/paths.js';

export async function status(): Promise<void> {
  try {
    assertInitialized();
  } catch (err) {
    error('NOT_INITIALIZED', err instanceof Error ? err.message : String(err));
    return;
  }

  const globalStatus = await readGlobalStatus();

  if (globalStatus.activeProject === null) {
    output({ active: null, status: null });
    return;
  }

  if (!existsSync(projectDir(globalStatus.activeProject))) {
    output({ active: null, status: null });
    return;
  }

  const projectStatus = await readProjectStatus(globalStatus.activeProject);

  output({ active: globalStatus.activeProject, status: projectStatus.status });
}
