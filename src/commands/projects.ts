import { assertInitialized } from '../utils/validation.js';
import { output, error } from '../utils/output.js';
import { readGlobalStatus } from '../state/global-status.js';
import { listProjects } from '../state/projects.js';

export async function projects(): Promise<void> {
  try {
    assertInitialized();
  } catch (err) {
    error('NOT_INITIALIZED', err instanceof Error ? err.message : String(err));
    return;
  }

  const globalStatus = await readGlobalStatus();
  const projectsList = await listProjects();

  output({ active: globalStatus.activeProject, projects: projectsList });
}
