import { relative, basename } from 'path';

export function parseGitignore(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .filter((line) => !line.startsWith('!')); // ignore negation for simplicity
}

export function shouldExclude(
  filePath: string,
  patterns: string[],
  baseDir: string
): boolean {
  const relPath = relative(baseDir, filePath).replace(/\\/g, '/');
  const fileName = basename(filePath);

  for (const pattern of patterns) {
    if (matchPattern(relPath, fileName, pattern)) {
      return true;
    }
  }
  return false;
}

function matchPattern(relPath: string, fileName: string, pattern: string): boolean {
  const normalizedPattern = pattern.replace(/^\/+/, '');

  if (pattern.endsWith('/')) {
    const dirPattern = normalizedPattern.slice(0, -1);
    const parts = relPath.split('/');
    return parts.some((part) => part === dirPattern);
  }

  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + normalizedPattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
    );
    return regex.test(fileName) || regex.test(relPath);
  }

  if (relPath === normalizedPattern) return true;
  if (fileName === normalizedPattern) return true;
  const parts = relPath.split('/');
  return parts.some((part) => part === normalizedPattern);
}
