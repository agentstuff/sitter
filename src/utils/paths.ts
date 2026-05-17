import { cwd } from 'process';
import { join } from 'path';

export function sitterDir(): string {
  return join(cwd(), 'sitter');
}

export function sitterProjectsDir(): string {
  return join(sitterDir(), 'projects');
}

export function sitterArchiveDir(): string {
  return join(sitterDir(), 'archive');
}

export function sitterSpecsDir(): string {
  return join(sitterDir(), 'specs');
}

export function projectDir(name: string): string {
  return join(sitterProjectsDir(), name);
}

export function globalStatusPath(): string {
  return join(sitterDir(), '.status.json');
}

export function projectStatusPath(name: string): string {
  return join(projectDir(name), '.status.json');
}

export function settingsPath(): string {
  return join(sitterDir(), 'settings.yaml');
}

export function taskTemplatePath(): string {
  return join(sitterDir(), 'TASK.md');
}

export function tasksPath(name: string): string {
  return join(projectDir(name), 'tasks.md');
}

export function visionPath(name: string): string {
  return join(projectDir(name), 'vision.md');
}

export function planPath(name: string): string {
  return join(projectDir(name), 'plan.md');
}

export function taskDetailPath(name: string, id: string): string {
  return join(projectDir(name), `task${id}.md`);
}
