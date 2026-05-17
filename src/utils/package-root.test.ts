import { describe, it, expect } from 'vitest';
import { resolvePackageRoot, resolveFromPackage } from './package-root.js';
import { existsSync } from 'fs';

describe('package-root', () => {
  it('resolves package root correctly', () => {
    const root = resolvePackageRoot();
    expect(existsSync(root + '/package.json')).toBe(true);
  });

  it('resolves paths from package root', () => {
    const path = resolveFromPackage('package.json');
    expect(existsSync(path)).toBe(true);
  });

  it('resolves nested paths from package root', () => {
    const path = resolveFromPackage('src', 'index.ts');
    expect(existsSync(path)).toBe(true);
  });
});
