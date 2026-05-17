import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { parseGitignore, shouldExclude } from './gitignore.js';

const DEFAULT_EXCLUDES = [
  'node_modules/',
  '.git/',
  'dist/',
  'coverage/',
  '.idea/',
  '.DS_Store',
];

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_DEPTH = 10;

export async function* scanFiles(
  baseDir: string
): AsyncGenerator<{ path: string; content: string }> {
  const gitignorePath = join(baseDir, '.gitignore');
  const patterns: string[] = [...DEFAULT_EXCLUDES];

  try {
    const content = await readFile(gitignorePath, 'utf-8');
    patterns.push(...parseGitignore(content));
  } catch {
    // .gitignore not found or unreadable, use defaults only
  }

  yield* walkDir(baseDir, baseDir, patterns, 0);
}

async function* walkDir(
  dir: string,
  baseDir: string,
  patterns: string[],
  depth: number
): AsyncGenerator<{ path: string; content: string }> {
  if (depth > MAX_DEPTH) {
    return;
  }

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    // skip directories we can't read
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(baseDir, fullPath).replace(/\\/g, '/');

    if (shouldExclude(fullPath, patterns, baseDir)) {
      continue;
    }

    if (entry.isDirectory()) {
      yield* walkDir(fullPath, baseDir, patterns, depth + 1);
    } else if (entry.isFile()) {
      try {
        const fileStat = await stat(fullPath);
        if (fileStat.size > MAX_FILE_SIZE) {
          continue;
        }
        const content = await readFile(fullPath, 'utf-8');
        yield { path: fullPath, content };
      } catch {
        // skip files we can't stat or read
        continue;
      }
    }
  }
}
