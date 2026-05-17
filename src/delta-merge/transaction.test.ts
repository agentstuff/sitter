import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { executeMerge } from './transaction.js';

let originalCwd: string;

describe('executeMerge', () => {
  let tempDir: string;
  let projectSpecsDir: string;
  let targetSpecsDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-merge-test-'));
    process.chdir(tempDir);
    projectSpecsDir = join(tempDir, 'project-specs');
    targetSpecsDir = join(tempDir, 'target-specs');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty result when no delta specs exist', async () => {
    mkdirSync(projectSpecsDir, { recursive: true });
    const result = await executeMerge(projectSpecsDir, targetSpecsDir);
    expect(result.success).toBe(true);
    expect(result.merged).toEqual([]);
  });

  it('merges a single delta into a new target', async () => {
    mkdirSync(join(projectSpecsDir, 'domain'), { recursive: true });
    writeFileSync(
      join(projectSpecsDir, 'domain', 'spec.md'),
      `## ADDED Requirements
### Requirement: Feature A
Desc A.`,
      'utf-8'
    );

    const result = await executeMerge(projectSpecsDir, targetSpecsDir);
    expect(result.success).toBe(true);
    expect(result.merged).toEqual(['domain/spec.md']);

    const targetContent = readFileSync(join(targetSpecsDir, 'domain', 'spec.md'), 'utf-8');
    expect(targetContent).toContain('Feature A');
    expect(targetContent).toContain('Desc A.');
  });

  it('merges delta into existing target', async () => {
    mkdirSync(join(projectSpecsDir, 'domain'), { recursive: true });
    mkdirSync(join(targetSpecsDir, 'domain'), { recursive: true });

    writeFileSync(
      join(projectSpecsDir, 'domain', 'spec.md'),
      `## ADDED Requirements
### Requirement: Feature B
Desc B.`,
      'utf-8'
    );

    writeFileSync(
      join(targetSpecsDir, 'domain', 'spec.md'),
      `# Domain

## Requirements

### Requirement: Feature A
Desc A.`,
      'utf-8'
    );

    const result = await executeMerge(projectSpecsDir, targetSpecsDir);
    expect(result.success).toBe(true);

    const targetContent = readFileSync(join(targetSpecsDir, 'domain', 'spec.md'), 'utf-8');
    expect(targetContent).toContain('Feature A');
    expect(targetContent).toContain('Feature B');
  });

  it('aborts all writes if any validation fails', async () => {
    mkdirSync(join(projectSpecsDir, 'domain-a'), { recursive: true });
    mkdirSync(join(projectSpecsDir, 'domain-b'), { recursive: true });
    mkdirSync(join(targetSpecsDir, 'domain-a'), { recursive: true });
    mkdirSync(join(targetSpecsDir, 'domain-b'), { recursive: true });

    // Valid delta for domain-a
    writeFileSync(
      join(projectSpecsDir, 'domain-a', 'spec.md'),
      `## ADDED Requirements
### Requirement: New A
Desc A.`,
      'utf-8'
    );

    // Invalid delta for domain-b (MODIFIED on empty target)
    writeFileSync(
      join(projectSpecsDir, 'domain-b', 'spec.md'),
      `## MODIFIED Requirements
### Requirement: Missing
Desc.`,
      'utf-8'
    );

    // Pre-existing target for domain-a
    writeFileSync(
      join(targetSpecsDir, 'domain-a', 'spec.md'),
      `## Requirements`,
      'utf-8'
    );

    const result = await executeMerge(projectSpecsDir, targetSpecsDir);
    expect(result.success).toBe(false);
    expect(result.error).toContain('MODIFIED is not allowed on a new target');

    // domain-a should NOT have been modified
    const targetA = readFileSync(join(targetSpecsDir, 'domain-a', 'spec.md'), 'utf-8');
    expect(targetA).not.toContain('New A');
  });

  it('handles nested directory structures', async () => {
    mkdirSync(join(projectSpecsDir, 'sub', 'nested'), { recursive: true });
    writeFileSync(
      join(projectSpecsDir, 'sub', 'nested', 'spec.md'),
      `## ADDED Requirements
### Requirement: Deep Feature
Desc.`,
      'utf-8'
    );

    const result = await executeMerge(projectSpecsDir, targetSpecsDir);
    expect(result.success).toBe(true);
    expect(result.merged).toEqual(['sub/nested/spec.md']);

    const targetContent = readFileSync(
      join(targetSpecsDir, 'sub', 'nested', 'spec.md'),
      'utf-8'
    );
    expect(targetContent).toContain('Deep Feature');
  });

  it('processes multiple delta specs', async () => {
    mkdirSync(join(projectSpecsDir, 'domain-a'), { recursive: true });
    mkdirSync(join(projectSpecsDir, 'domain-b'), { recursive: true });

    writeFileSync(
      join(projectSpecsDir, 'domain-a', 'spec.md'),
      `## ADDED Requirements
### Requirement: Feature A
Desc A.`,
      'utf-8'
    );

    writeFileSync(
      join(projectSpecsDir, 'domain-b', 'spec.md'),
      `## ADDED Requirements
### Requirement: Feature B
Desc B.`,
      'utf-8'
    );

    const result = await executeMerge(projectSpecsDir, targetSpecsDir);
    expect(result.success).toBe(true);
    expect(result.merged).toHaveLength(2);
    expect(result.merged).toContain('domain-a/spec.md');
    expect(result.merged).toContain('domain-b/spec.md');
  });

  it('handles empty delta file', async () => {
    mkdirSync(join(projectSpecsDir, 'domain'), { recursive: true });
    writeFileSync(join(projectSpecsDir, 'domain', 'spec.md'), '', 'utf-8');

    const result = await executeMerge(projectSpecsDir, targetSpecsDir);
    expect(result.success).toBe(true);
    expect(result.merged).toEqual(['domain/spec.md']);

    const targetContent = readFileSync(join(targetSpecsDir, 'domain', 'spec.md'), 'utf-8');
    expect(targetContent).toBe('## Requirements\n');
  });

  it('ignores non-spec.md files', async () => {
    mkdirSync(join(projectSpecsDir, 'domain'), { recursive: true });
    writeFileSync(
      join(projectSpecsDir, 'domain', 'README.md'),
      `## ADDED Requirements
### Requirement: Feature A
Desc A.`,
      'utf-8'
    );

    const result = await executeMerge(projectSpecsDir, targetSpecsDir);
    expect(result.success).toBe(true);
    expect(result.merged).toEqual([]);
  });
});
