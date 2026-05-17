import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * Resolve the npm package root directory.
 * Walks up from the current file until it finds package.json with name "sitter".
 * This works regardless of the current working directory.
 */
export function resolvePackageRoot(): string {
  // Start from this file's directory (src/utils/ or dist/utils/)
  const currentFile = fileURLToPath(import.meta.url);
  let currentDir = dirname(currentFile);

  // Walk up until we find package.json
  // Limit to 10 levels to prevent infinite loops
  for (let i = 0; i < 10; i++) {
    const packageJsonPath = join(currentDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.name === 'sitter') {
          return currentDir;
        }
      } catch {
        // Not valid JSON or not sitter package, keep walking
      }
    }
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }
    currentDir = parentDir;
  }

  throw new Error('Could not find Sitter package root. Ensure sitter is properly installed.');
}

/**
 * Resolve a path relative to the package root.
 */
export function resolveFromPackage(...paths: string[]): string {
  const packageRoot = resolvePackageRoot();
  return join(packageRoot, ...paths);
}
