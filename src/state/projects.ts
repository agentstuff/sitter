import { readdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { sitterProjectsDir } from '../utils/paths.js';
import { readGlobalStatus } from './global-status.js';

export async function listProjects(): Promise<string[]> {
  const projectsDir = sitterProjectsDir();

  if (!existsSync(projectsDir)) {
    return [];
  }

  const entries = await readdir(projectsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function projectExists(name: string): boolean {
  const projectsDir = sitterProjectsDir();
  const projectPath = join(projectsDir, name);

  if (!existsSync(projectPath)) {
    return false;
  }

  try {
    return statSync(projectPath).isDirectory();
  } catch {
    return false;
  }
}

export async function isProjectActive(name: string): Promise<boolean> {
  const globalStatus = await readGlobalStatus();
  return globalStatus.activeProject === name;
}
