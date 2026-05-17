import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { projectStatusPath } from '../utils/paths.js';
import { atomicWrite } from '../utils/atomic-write.js';

export interface ProjectStatus {
  status: 'IMPLEMENT' | 'REVIEW';
  currentTask: number | null;
}

const DEFAULT_PROJECT_STATUS: ProjectStatus = {
  status: 'IMPLEMENT',
  currentTask: null,
};

const VALID_STATUSES: Set<string> = new Set(['IMPLEMENT', 'REVIEW']);

function isValidStatus(value: unknown): value is 'IMPLEMENT' | 'REVIEW' {
  return typeof value === 'string' && VALID_STATUSES.has(value);
}

export async function readProjectStatus(projectName: string): Promise<ProjectStatus> {
  const path = projectStatusPath(projectName);

  if (!existsSync(path)) {
    return { ...DEFAULT_PROJECT_STATUS };
  }

  const content = await readFile(path, 'utf-8');

  try {
    const parsed = JSON.parse(content) as unknown;

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Project status file must contain a JSON object');
    }

    const status = parsed as Record<string, unknown>;
    const statusValue = status.status;

    if (!isValidStatus(statusValue)) {
      throw new Error(`Invalid project status: "${statusValue}". Must be "IMPLEMENT" or "REVIEW".`);
    }

    const currentTask = status.currentTask ?? null;

    return { status: statusValue, currentTask: typeof currentTask === 'number' ? currentTask : null };
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Malformed project status file at ${path}: ${err.message}`);
    }
    throw err;
  }
}

export async function writeProjectStatus(projectName: string, status: ProjectStatus): Promise<void> {
  if (!isValidStatus(status.status)) {
    throw new Error(`Invalid project status: "${status.status}". Must be "IMPLEMENT" or "REVIEW".`);
  }

  const content = JSON.stringify({ status: status.status, currentTask: status.currentTask }, null, 2);
  await atomicWrite(projectStatusPath(projectName), content);
}
