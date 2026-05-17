import { existsSync, statSync } from 'fs';
import { sitterDir, globalStatusPath } from './paths.js';

export function validateProjectName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error('Project name must be non-empty');
  }

  if (name.length > 50) {
    throw new Error('Project name must be 50 characters or fewer');
  }

  if (name.startsWith('-')) {
    throw new Error('Project name must not start with a hyphen');
  }

  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(name)) {
    throw new Error(
      'Project name must contain only letters, numbers, hyphens, and underscores'
    );
  }
}

export function isInitialized(): boolean {
  const dir = sitterDir();
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return false;
  }
  return existsSync(globalStatusPath());
}

export function assertInitialized(): void {
  if (!isInitialized()) {
    throw new Error(
      'Sitter is not initialized. Run `sitter init` first.'
    );
  }
}
