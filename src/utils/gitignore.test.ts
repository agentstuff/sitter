import { describe, it, expect } from 'vitest';
import { parseGitignore, shouldExclude } from './gitignore.js';
import { join } from 'path';

describe('parseGitignore', () => {
  it('returns empty array for empty content', () => {
    expect(parseGitignore('')).toEqual([]);
  });

  it('skips empty lines and comments', () => {
    const content = `# Comment\n\nnode_modules/\n\n# Another comment\ndist/`;
    expect(parseGitignore(content)).toEqual(['node_modules/', 'dist/']);
  });

  it('handles various patterns', () => {
    const content = `node_modules/\n.git/\n*.log\n.env\ncoverage/\nbuild/`;
    expect(parseGitignore(content)).toEqual([
      'node_modules/',
      '.git/',
      '*.log',
      '.env',
      'coverage/',
      'build/',
    ]);
  });

  it('ignores negation patterns', () => {
    const content = `node_modules/\n!important.log\n*.log`;
    expect(parseGitignore(content)).toEqual(['node_modules/', '*.log']);
  });

  it('trims whitespace from lines', () => {
    const content = `  node_modules/  \n  *.log  `;
    expect(parseGitignore(content)).toEqual(['node_modules/', '*.log']);
  });
});

describe('shouldExclude', () => {
  const baseDir = '/project';

  it('excludes directories matching dir/ pattern', () => {
    expect(shouldExclude(join(baseDir, 'node_modules'), ['node_modules/'], baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, 'node_modules', 'package.json'), ['node_modules/'], baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, 'src', 'node_modules'), ['node_modules/'], baseDir)).toBe(true);
  });

  it('excludes files matching exact pattern', () => {
    expect(shouldExclude(join(baseDir, '.DS_Store'), ['.DS_Store'], baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, 'src', '.DS_Store'), ['.DS_Store'], baseDir)).toBe(true);
  });

  it('excludes files matching glob patterns', () => {
    expect(shouldExclude(join(baseDir, 'debug.log'), ['*.log'], baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, 'src', 'error.log'), ['*.log'], baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, 'app.js'), ['*.log'], baseDir)).toBe(false);
  });

  it('does not exclude non-matching files', () => {
    expect(shouldExclude(join(baseDir, 'src', 'index.ts'), ['node_modules/'], baseDir)).toBe(false);
    expect(shouldExclude(join(baseDir, 'README.md'), ['*.log'], baseDir)).toBe(false);
  });

  it('handles multiple patterns', () => {
    const patterns = ['node_modules/', '.git/', '*.log'];
    expect(shouldExclude(join(baseDir, 'node_modules', 'x'), patterns, baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, '.git', 'config'), patterns, baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, 'test.log'), patterns, baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, 'src', 'main.ts'), patterns, baseDir)).toBe(false);
  });

  it('handles leading slash in patterns', () => {
    expect(shouldExclude(join(baseDir, 'build'), ['/build'], baseDir)).toBe(true);
    expect(shouldExclude(join(baseDir, 'src', 'build'), ['/build'], baseDir)).toBe(true);
  });
});
