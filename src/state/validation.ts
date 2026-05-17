import { existsSync } from 'fs';
import { projectDir } from '../utils/paths.js';
import { readGlobalStatus } from './global-status.js';

export function validateStatusTransition(from: string, to: string): void {
  const validStatuses = new Set(['IMPLEMENT', 'REVIEW']);

  if (!validStatuses.has(from)) {
    throw new Error(`Invalid source status: "${from}". Must be "IMPLEMENT" or "REVIEW".`);
  }

  if (!validStatuses.has(to)) {
    throw new Error(`Invalid target status: "${to}". Must be "IMPLEMENT" or "REVIEW".`);
  }

  if (from === to) {
    throw new Error(`Cannot transition from "${from}" to "${to}". Status is already "${from}".`);
  }
}

export function assertProjectExists(projectName: string): void {
  if (!existsSync(projectDir(projectName))) {
    throw new Error(`Project "${projectName}" does not exist.`);
  }
}

export async function assertActiveProject(): Promise<string> {
  const globalStatus = await readGlobalStatus();

  if (globalStatus.activeProject === null) {
    throw new Error('No active project set.');
  }

  return globalStatus.activeProject;
}
