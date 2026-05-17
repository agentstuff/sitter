import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { merge } from './merge.js';
import { init } from './init.js';
import { visionCreate } from './vision.js';

let originalCwd: string;

async function captureOutputAsync(fn: () => Promise<void>): Promise<Record<string, unknown>> {
  const outputs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
    outputs.push(msg);
  });
  await fn();
  spy.mockRestore();
  if (outputs.length === 0) return {};
  return JSON.parse(outputs[outputs.length - 1]);
}

describe('merge command', () => {
  let tempDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'sitter-merge-cmd-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('errors when no active project', async () => {
    await init();
    const result = await captureOutputAsync(() => merge());
    expect(result).toEqual({
      error: 'NO_ACTIVE_PROJECT',
      message: 'No active project set.',
    });
  });

  it('errors when project has no specs directory', async () => {
    await init();
    await visionCreate('my-project');

    const result = await captureOutputAsync(() => merge());
    expect(result).toEqual({
      error: 'NO_DELTA_SPECS',
      message: 'Project has no delta specs directory.',
    });
  });

  it('successfully merges specs', async () => {
    await init();
    await visionCreate('my-project');

    // Create delta specs
    const specsDir = join(tempDir, 'sitter', 'projects', 'my-project', 'specs', 'domain');
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(
      join(specsDir, 'spec.md'),
      `## ADDED Requirements
### Requirement: New Feature
Desc.`,
      'utf-8'
    );

    const result = await captureOutputAsync(() => merge());
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('merged_specs');
    const merged = result.merged_specs as string[];
    expect(merged).toContain('domain/spec.md');
  });

  it('returns merge error on validation failure', async () => {
    await init();
    await visionCreate('my-project');

    // Create invalid delta specs (MODIFIED on empty target)
    const specsDir = join(tempDir, 'sitter', 'projects', 'my-project', 'specs', 'domain');
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(
      join(specsDir, 'spec.md'),
      `## MODIFIED Requirements
### Requirement: Missing
Desc.`,
      'utf-8'
    );

    const result = await captureOutputAsync(() => merge());
    expect(result).toEqual({
      error: 'MERGE_FAILED',
      message: 'Target spec is empty. MODIFIED is not allowed on a new target.',
    });
  });
});
