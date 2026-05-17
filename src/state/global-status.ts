import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { globalStatusPath } from '../utils/paths.js';
import { atomicWrite } from '../utils/atomic-write.js';

export interface GlobalStatus {
  version: string;
  activeProject: string | null;
}

const DEFAULT_GLOBAL_STATUS: GlobalStatus = {
  version: '1.0',
  activeProject: null,
};

export async function readGlobalStatus(): Promise<GlobalStatus> {
  const path = globalStatusPath();

  if (!existsSync(path)) {
    return { ...DEFAULT_GLOBAL_STATUS };
  }

  const content = await readFile(path, 'utf-8');

  try {
    const parsed = JSON.parse(content) as unknown;

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Global status file must contain a JSON object');
    }

    const status = parsed as Record<string, unknown>;
    const version = typeof status.version === 'string' ? status.version : DEFAULT_GLOBAL_STATUS.version;
    const activeProject = status.activeProject === null || typeof status.activeProject === 'string'
      ? status.activeProject
      : DEFAULT_GLOBAL_STATUS.activeProject;

    return { version, activeProject };
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Malformed global status file at ${path}: ${err.message}`);
    }
    throw err;
  }
}

export async function writeGlobalStatus(status: GlobalStatus): Promise<void> {
  const content = JSON.stringify(status, null, 2);
  await atomicWrite(globalStatusPath(), content);
}
