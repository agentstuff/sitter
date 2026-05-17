import { rm } from 'fs/promises';
import { assertInitialized } from '../utils/validation.js';
import { success, error } from '../utils/output.js';
import { assertProjectExists } from '../state/validation.js';
import { readGlobalStatus, writeGlobalStatus } from '../state/global-status.js';
import { projectDir } from '../utils/paths.js';

export async function projectActive(name: string): Promise<void> {
  try {
    assertInitialized();
  } catch (err) {
    error('NOT_INITIALIZED', err instanceof Error ? err.message : String(err));
    return;
  }

  try {
    assertProjectExists(name);
  } catch (err) {
    error('PROJECT_NOT_FOUND', err instanceof Error ? err.message : String(err));
    return;
  }

  const globalStatus = await readGlobalStatus();
  globalStatus.activeProject = name;
  await writeGlobalStatus(globalStatus);

  success({ active: name });
}

export async function projectDrop(name: string): Promise<void> {
  try {
    assertInitialized();
  } catch (err) {
    error('NOT_INITIALIZED', err instanceof Error ? err.message : String(err));
    return;
  }

  try {
    assertProjectExists(name);
  } catch (err) {
    error('PROJECT_NOT_FOUND', err instanceof Error ? err.message : String(err));
    return;
  }

  await rm(projectDir(name), { recursive: true, force: true });

  const globalStatus = await readGlobalStatus();
  if (globalStatus.activeProject === name) {
    globalStatus.activeProject = null;
    await writeGlobalStatus(globalStatus);
  }

  success({ dropped: true, name });
}
